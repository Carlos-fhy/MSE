import Editor from "@monaco-editor/react";
import { useState } from "react";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export default function JsonEditor({
  value,
  onChange,
  height = "400px",
  readOnly = false,
}: JsonEditorProps) {
  const [error, setError] = useState<string | null>(null);

  const handleEditorChange = (newValue: string | undefined) => {
    if (!newValue) {
      onChange("");
      return;
    }

    // Validate JSON
    try {
      JSON.parse(newValue);
      setError(null);
      onChange(newValue);
    } catch (e: any) {
      setError(e.message);
      onChange(newValue); // Still update to show user's input
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Editor
        height={height}
        defaultLanguage="json"
        value={value}
        onChange={handleEditorChange}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          formatOnPaste: true,
          formatOnType: true,
          automaticLayout: true,
          tabSize: 2,
        }}
        theme="vs-dark"
      />
      {error && (
        <div style={{ color: "red", marginTop: 8, fontSize: 12 }}>
          JSON 格式错误: {error}
        </div>
      )}
    </div>
  );
}
