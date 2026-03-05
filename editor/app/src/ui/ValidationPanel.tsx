export type ValidationLevel = "Error" | "Warning" | "Info";

export type ValidationItem = {
  level: ValidationLevel;
  message: string;
};

type ValidationPanelProps = {
  items: ValidationItem[];
};

export default function ValidationPanel(props: ValidationPanelProps): JSX.Element {
  return (
    <div>
      <h2>ValidationPanel</h2>
      <ul style={{ margin: 0, paddingLeft: "18px" }}>
        {props.items.map((item, index) => (
          <li key={`${item.level}-${index}`}>
            <strong>[{item.level}]</strong> {item.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
