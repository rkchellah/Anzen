import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored Blazity shadcn-chatbot-kit (owned source, lint upstream style separately)
    "components/ui/chat.tsx",
    "components/ui/chat-message.tsx",
    "components/ui/markdown-renderer.tsx",
    "components/ui/message-input.tsx",
    "components/ui/message-list.tsx",
    "components/ui/prompt-suggestions.tsx",
    "components/ui/typing-indicator.tsx",
    "components/ui/interrupt-prompt.tsx",
    "components/ui/audio-visualizer.tsx",
    "components/ui/file-preview.tsx",
    "components/ui/copy-button.tsx",
    "hooks/use-audio-recording.ts",
    "hooks/use-auto-scroll.ts",
    "hooks/use-autosize-textarea.ts",
    "hooks/use-copy-to-clipboard.ts",
    "lib/audio-utils.ts",
  ]),
]);

export default eslintConfig;
