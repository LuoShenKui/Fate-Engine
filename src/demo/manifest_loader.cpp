#include "demo/manifest_loader.h"

#include <cctype>
#include <fstream>
#include <map>
#include <sstream>
#include <stdexcept>
#include <vector>

namespace fate_demo {

void ValidateManifestRequiredFields(const std::string& content) {
  const std::vector<std::string> required_fields = {
      "\"id\"", "\"version\"", "\"params\"", "\"defaults\"", "\"license\""};
  std::vector<std::string> missing;
  for (const auto& field : required_fields) {
    if (content.find(field) == std::string::npos) {
      missing.push_back(field);
    }
  }

  const bool has_dependencies = content.find("\"dependencies\"") != std::string::npos;
  const bool has_legacy_deps = content.find("\"deps\"") != std::string::npos;
  if (!has_dependencies && !has_legacy_deps) {
    missing.push_back("\"dependencies\"|\"deps\"");
  }

  const bool has_engine_compat = content.find("\"engine_compat\"") != std::string::npos;
  const bool has_legacy_compat = content.find("\"compat\"") != std::string::npos;
  if (!has_engine_compat && !has_legacy_compat) {
    missing.push_back("\"engine_compat\"|\"compat\"");
  }

  if (!missing.empty()) {
    std::ostringstream oss;
    oss << "manifest 缺少必填字段: ";
    for (size_t i = 0; i < missing.size(); ++i) {
      if (i > 0) {
        oss << ",";
      }
      oss << missing[i];
    }
    throw std::runtime_error(oss.str());
  }
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
          if (input_[pos_] == '-' ||
              std::isdigit(static_cast<unsigned char>(input_[pos_]))) {
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
      if (pos_ < input_.size() &&
          (input_[pos_] == 'e' || input_[pos_] == 'E')) {
        ++pos_;
        if (pos_ < input_.size() &&
            (input_[pos_] == '+' || input_[pos_] == '-')) {
          ++pos_;
        }
        ConsumeDigits();
      }
      JsonValue value;
      value.type = JsonValue::Type::Number;
      return value;
    }

    void ConsumeDigits() {
      if (pos_ >= input_.size() ||
          !std::isdigit(static_cast<unsigned char>(input_[pos_]))) {
        throw std::runtime_error("JSON 解析失败: 数字格式错误");
      }
      while (pos_ < input_.size() &&
             std::isdigit(static_cast<unsigned char>(input_[pos_]))) {
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
      while (pos_ < input_.size() &&
             std::isspace(static_cast<unsigned char>(input_[pos_]))) {
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

  auto object_get = [](const JsonValue& value,
                       const std::string& member) -> const JsonValue* {
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
    throw std::runtime_error("manifest 字段类型错误: params." + key +
                             ".default 不是 bool");
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
  ValidateManifestRequiredFields(content);

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

}  // namespace fate_demo
