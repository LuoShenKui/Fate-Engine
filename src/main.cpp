#include <fstream>
#include <iostream>
#include <cctype>
#include <map>
#include <stdexcept>
#include <sstream>
#include <string>
#include <stdexcept>
#include <vector>

struct DoorState {
  bool enabled = true;
  bool locked = false;
  bool open = false;
  bool has_collision = true;
  bool has_trigger = true;
};

class DoorBrick {
 public:
  explicit DoorBrick(std::string brick_id, DoorState state = {})
      : brick_id_(std::move(brick_id)), state_(state) {}

  std::pair<std::string, std::string> Interact(const std::string& actor_id) {
    if (!state_.enabled) {
      return {"OnDenied", "reason=disabled"};
    }
    if (state_.locked) {
      return {"OnDenied", "reason=locked"};
    }
    state_.open = !state_.open;
    return {"OnUsed", "actor_id=" + actor_id + ",open=" + BoolToString(state_.open)};
  }

  std::pair<std::string, std::string> SetState(const std::string& key, bool value) {
    if (key == "enabled") {
      state_.enabled = value;
    } else if (key == "locked") {
      state_.locked = value;
    } else if (key == "open") {
      state_.open = value;
    } else if (key == "has_collision") {
      state_.has_collision = value;
    } else if (key == "has_trigger") {
      state_.has_trigger = value;
    } else {
      return {"OnDenied", "reason=unknown_state:" + key};
    }
    return {"OnStateChanged", "key=" + key + ",value=" + BoolToString(value)};
  }

  const DoorState& state() const { return state_; }

 private:
  static std::string BoolToString(bool value) { return value ? "true" : "false"; }

  std::string brick_id_;
  DoorState state_;
};

std::vector<std::string> ValidateDoorConfig(const std::string& door_name,
                                            const DoorState& state) {
  std::vector<std::string> issues;
  if (!state.has_collision) {
    issues.push_back("Error:" + door_name + ":MISSING_COLLISION:Door 缺少碰撞体");
  }
  if (!state.has_trigger) {
    issues.push_back("Error:" + door_name + ":MISSING_TRIGGER:Door 缺少触发体");
  }
  return issues;
}

bool ParseDefaultBool(const std::string& content, const std::string& key,
                      bool fallback) {
  struct JsonValue {
    enum class Type { Null, Bool, Number, String, Object, Array };

    Type type = Type::Null;
    bool bool_value = false;
    std::map<std::string, JsonValue> object_value;
    std::vector<JsonValue> array_value;
  };

  class JsonParser {
   public:
    explicit JsonParser(const std::string& input) : input_(input) {}

    JsonValue Parse() {
      SkipWhitespace();
      JsonValue value = ParseValue();
      SkipWhitespace();
      if (pos_ != input_.size()) {
        throw std::runtime_error("JSON 解析失败: 存在多余内容");
      }
      return value;
    }

   private:
    JsonValue ParseValue() {
      SkipWhitespace();
      if (pos_ >= input_.size()) {
        throw std::runtime_error("JSON 解析失败: 意外结束");
      }
      switch (input_[pos_]) {
        case '{':
          return ParseObject();
        case '[':
          return ParseArray();
        case '"': {
          ParseString();
          JsonValue value;
          value.type = JsonValue::Type::String;
          return value;
        }
        case 't':
          return ParseTrue();
        case 'f':
          return ParseFalse();
        case 'n':
          return ParseNull();
        default:
          if (input_[pos_] == '-' || std::isdigit(static_cast<unsigned char>(input_[pos_]))) {
            return ParseNumber();
          }
          throw std::runtime_error("JSON 解析失败: 非法字符");
      }
    }

    JsonValue ParseObject() {
      JsonValue value;
      value.type = JsonValue::Type::Object;
      Expect('{');
      SkipWhitespace();
      if (TryConsume('}')) {
        return value;
      }
      while (true) {
        std::string key_name = ParseString();
        SkipWhitespace();
        Expect(':');
        JsonValue member = ParseValue();
        value.object_value.emplace(std::move(key_name), std::move(member));
        SkipWhitespace();
        if (TryConsume('}')) {
          break;
        }
        Expect(',');
      }
      return value;
    }

    JsonValue ParseArray() {
      JsonValue value;
      value.type = JsonValue::Type::Array;
      Expect('[');
      SkipWhitespace();
      if (TryConsume(']')) {
        return value;
      }
      while (true) {
        value.array_value.push_back(ParseValue());
        SkipWhitespace();
        if (TryConsume(']')) {
          break;
        }
        Expect(',');
      }
      return value;
    }

    std::string ParseString() {
      Expect('"');
      std::string out;
      while (pos_ < input_.size()) {
        char ch = input_[pos_++];
        if (ch == '"') {
          return out;
        }
        if (ch == '\\') {
          if (pos_ >= input_.size()) {
            throw std::runtime_error("JSON 解析失败: 字符串转义不完整");
          }
          char esc = input_[pos_++];
          switch (esc) {
            case '"':
            case '\\':
            case '/':
              out.push_back(esc);
              break;
            case 'b':
              out.push_back('\b');
              break;
            case 'f':
              out.push_back('\f');
              break;
            case 'n':
              out.push_back('\n');
              break;
            case 'r':
              out.push_back('\r');
              break;
            case 't':
              out.push_back('\t');
              break;
            default:
              throw std::runtime_error("JSON 解析失败: 不支持的转义字符");
          }
        } else {
          out.push_back(ch);
        }
      }
      throw std::runtime_error("JSON 解析失败: 字符串缺少结束引号");
    }

    JsonValue ParseTrue() {
      ExpectLiteral("true");
      JsonValue value;
      value.type = JsonValue::Type::Bool;
      value.bool_value = true;
      return value;
    }

    JsonValue ParseFalse() {
      ExpectLiteral("false");
      JsonValue value;
      value.type = JsonValue::Type::Bool;
      value.bool_value = false;
      return value;
    }

    JsonValue ParseNull() {
      ExpectLiteral("null");
      JsonValue value;
      value.type = JsonValue::Type::Null;
      return value;
    }

    JsonValue ParseNumber() {
      if (input_[pos_] == '-') {
        ++pos_;
      }
      ConsumeDigits();
      if (pos_ < input_.size() && input_[pos_] == '.') {
        ++pos_;
        ConsumeDigits();
      }
      if (pos_ < input_.size() && (input_[pos_] == 'e' || input_[pos_] == 'E')) {
        ++pos_;
        if (pos_ < input_.size() && (input_[pos_] == '+' || input_[pos_] == '-')) {
          ++pos_;
        }
        ConsumeDigits();
      }
      JsonValue value;
      value.type = JsonValue::Type::Number;
      return value;
    }

    void ConsumeDigits() {
      if (pos_ >= input_.size() || !std::isdigit(static_cast<unsigned char>(input_[pos_]))) {
        throw std::runtime_error("JSON 解析失败: 数字格式错误");
      }
      while (pos_ < input_.size() && std::isdigit(static_cast<unsigned char>(input_[pos_]))) {
        ++pos_;
      }
    }

    void Expect(char expected) {
      SkipWhitespace();
      if (pos_ >= input_.size() || input_[pos_] != expected) {
        throw std::runtime_error("JSON 解析失败: 缺少期望字符");
      }
      ++pos_;
    }

    bool TryConsume(char ch) {
      SkipWhitespace();
      if (pos_ < input_.size() && input_[pos_] == ch) {
        ++pos_;
        return true;
      }
      return false;
    }

    void ExpectLiteral(const char* literal) {
      for (size_t i = 0; literal[i] != '\0'; ++i) {
        if (pos_ >= input_.size() || input_[pos_] != literal[i]) {
          throw std::runtime_error("JSON 解析失败: 字面量不匹配");
        }
        ++pos_;
      }
    }

    void SkipWhitespace() {
      while (pos_ < input_.size() && std::isspace(static_cast<unsigned char>(input_[pos_]))) {
        ++pos_;
      }
    }

    const std::string& input_;
    size_t pos_ = 0;
  };

  const auto root = JsonParser(content).Parse();
  if (root.type != JsonValue::Type::Object) {
    return fallback;
  }

  auto object_get = [](const JsonValue& value, const std::string& member) -> const JsonValue* {
    if (value.type != JsonValue::Type::Object) {
      return nullptr;
    }
    auto it = value.object_value.find(member);
    if (it == value.object_value.end()) {
      return nullptr;
    }
    return &it->second;
  };

  const JsonValue* params = object_get(root, "params");
  if (params == nullptr) {
    return fallback;
  }
  const JsonValue* param = object_get(*params, key);
  if (param == nullptr) {
    return fallback;
  }
  const JsonValue* default_value = object_get(*param, "default");
  if (default_value == nullptr) {
    return fallback;
  }
  if (default_value->type != JsonValue::Type::Bool) {
    throw std::runtime_error("manifest 字段类型错误: params." + key + ".default 不是 bool");
  }
  return default_value->bool_value;
}

DoorState LoadDoorDefaults(const std::string& path) {
  std::ifstream input(path);
  if (!input) {
    throw std::runtime_error("无法读取 manifest: " + path);
  }

  std::stringstream buffer;
  buffer << input.rdbuf();
  const auto content = buffer.str();

  DoorState state;
  try {
    state.locked = ParseDefaultBool(content, "locked", false);
    state.open = ParseDefaultBool(content, "open", false);
    state.has_collision = ParseDefaultBool(content, "has_collision", true);
    state.has_trigger = ParseDefaultBool(content, "has_trigger", true);
  } catch (const std::exception& ex) {
    throw std::runtime_error("解析 manifest 失败: " + path + ", " + ex.what());
  }
  return state;
}

int main() {
  try {
    auto state = LoadDoorDefaults("bricks/door/manifest.json");
    DoorBrick door("fate.door.basic", state);

    std::cout << "=== Door Demo (C++) ===\n";
    std::cout << "初始状态: enabled=true"
              << ",locked=" << (door.state().locked ? "true" : "false")
              << ",open=" << (door.state().open ? "true" : "false")
              << ",has_collision=" << (door.state().has_collision ? "true" : "false")
              << ",has_trigger=" << (door.state().has_trigger ? "true" : "false") << "\n";

    auto [event1, payload1] = door.Interact("player_1");
    std::cout << "Interact -> " << event1 << " {" << payload1 << "}\n";

    auto [event2, payload2] = door.SetState("locked", true);
    std::cout << "SetState(locked=true) -> " << event2 << " {" << payload2 << "}\n";

    auto [event3, payload3] = door.Interact("player_1");
    std::cout << "Interact when locked -> " << event3 << " {" << payload3 << "}\n";

    const auto report = ValidateDoorConfig("demo_door", door.state());
    if (report.empty()) {
      std::cout << "校验报告: OK\n";
    } else {
      std::cout << "校验报告:\n";
      for (const auto& issue : report) {
        std::cout << "  - " << issue << "\n";
      }
    }
  } catch (const std::exception& ex) {
    std::cerr << "运行失败: " << ex.what() << "\n";
    return 1;
  }

  return 0;
}
