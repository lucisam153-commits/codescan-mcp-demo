# 🚀 Presh-ar Codescan MCP Server - Live Demo

Welcome! This is a fully self-contained environment to demonstrate the power of the **Codescan MCP Server**. The AI assistant running in this editor has been securely connected directly to the Codescan APIs, granting it the ability to instantly inspect code quality, static analysis metrics, and vulnerabilities.

## 🛠️ Step 1: Connect your Codescan Account

Before asking the AI to pull metrics, we need to give it your secure token.

1. Open the `.vscode/cline_mcp_settings.json` file in this editor.
2. Replace `"replace_with_your_codescan_token"` with your actual Codescan Token.
3. Replace `"replace_with_your_organization_id"` and `"replace_with_your_project_id"` with your organization and project keys.
4. Save the file (`Ctrl+S` or `Cmd+S`). 

*The AI extension will automatically detect the changes and connect to the server.*

## 🪄 Step 2: The Magic Prompts

Click the **Cline** icon on the left sidebar (it looks like a little robot) or press `Ctrl+Shift+P` and type "Cline: Open".

Once the chat is open, copy and paste these exact prompts to watch the AI interact with your live Codescan data:

### 🌟 Prompt 1: The Quick Health Check
> "Use your Codescan tools to fetch the latest quality gate status and high-severity issues for my default project."

### 🌟 Prompt 2: Deep Vulnerability Analysis
> "Pull the detailed list of current vulnerabilities from Codescan. Group them by severity, and draft an executive summary email addressing the security risks we need to fix this week."

### 🌟 Prompt 3: Technical Remediation
> "Find the most critical code smell or bug in the Codescan report, explain exactly why it's a problem, and generate the code snippet required to fix it."

---
*Note: This environment will automatically destroy itself when you close the tab, keeping your tokens secure.*
