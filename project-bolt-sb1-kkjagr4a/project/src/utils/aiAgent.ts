import OpenAI from 'openai';
import { TableData, TableCell } from '../types';

export class AIAgent {
  private openai: OpenAI | null = null;
  private isConfigured = false;
  private hasQuotaIssue = false;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
      });
      this.isConfigured = true;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private createCell(value: number, row: number, col: number): TableCell {
    return {
      id: this.generateId(),
      value,
      row,
      col
    };
  }

  private getTableContext(data: TableData): string {
    const tableInfo = `Current table has ${data.headers.length} columns (${data.headers.join(', ')}) and ${data.rows.length} rows.`;
    const tableData = data.rows.map((row, idx) => 
      `Row ${idx + 1}: ${row.map(cell => cell.value).join(', ')}`
    ).join('\n');
    
    return `${tableInfo}\n\nTable data:\n${tableData}`;
  }

  private getSystemPrompt(): string {
    return `You are an AI assistant that helps users manipulate a data table. You can:

1. ADD ROWS: Add new rows with specified values
2. EDIT CELLS: Change specific cell values
3. DELETE ROWS: Remove rows from the table
4. ADD COLUMNS: Add new columns to the table
5. FILL COLUMNS: Fill entire columns with a value

IMPORTANT RESPONSE FORMAT:
You must respond with a JSON object containing:
- "action": the type of action ("add_row", "edit_cell", "delete_row", "add_column", "fill_column", or "none")
- "parameters": object with the specific parameters for the action
- "message": a human-readable response to the user

ACTION FORMATS:
- add_row: {"action": "add_row", "parameters": {"values": [1, 2, 3]}, "message": "Added new row"}
- edit_cell: {"action": "edit_cell", "parameters": {"row": 0, "col": 1, "value": 42}, "message": "Updated cell"}
- delete_row: {"action": "delete_row", "parameters": {"row": 1}, "message": "Deleted row 2"}
- add_column: {"action": "add_column", "parameters": {"header": "New Column"}, "message": "Added column"}
- fill_column: {"action": "fill_column", "parameters": {"col": 0, "value": 10}, "message": "Filled column"}
- none: {"action": "none", "parameters": {}, "message": "Your response here"}

Use 0-based indexing for rows and columns in parameters, but refer to them as 1-based in messages.
Always respond with valid JSON only.`;
  }

  public getApiStatus(): 'configured' | 'not_configured' | 'quota_exceeded' {
    if (!this.isConfigured) return 'not_configured';
    if (this.hasQuotaIssue) return 'quota_exceeded';
    return 'configured';
  }

  public async processCommand(command: string, currentData: TableData): Promise<{ 
    newData: TableData | null; 
    response: string 
  }> {
    // If OpenAI is not configured or has quota issues, fall back to pattern matching
    if (!this.isConfigured || this.hasQuotaIssue) {
      const fallbackResult = this.fallbackProcessCommand(command, currentData);
      
      // Add quota issue notice if applicable
      if (this.hasQuotaIssue && !fallbackResult.response.includes('quota')) {
        fallbackResult.response += ' (OpenAI API quota exceeded - using fallback mode)';
      }
      
      return fallbackResult;
    }

    try {
      const tableContext = this.getTableContext(currentData);
      
      const completion = await this.openai!.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt()
          },
          {
            role: "user",
            content: `${tableContext}\n\nUser command: "${command}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      let aiResponse;
      try {
        aiResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse AI response:', responseText);
        throw new Error('Invalid response format from AI');
      }

      // Execute the action
      const newData = this.executeAction(aiResponse.action, aiResponse.parameters, currentData);
      
      return {
        newData,
        response: aiResponse.message || 'Action completed successfully'
      };

    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      
      // Check if it's a quota/billing error
      if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('billing')) {
        this.hasQuotaIssue = true;
        
        const fallbackResult = this.fallbackProcessCommand(command, currentData);
        return {
          newData: fallbackResult.newData,
          response: `⚠️ OpenAI API quota exceeded. Please check your billing at https://platform.openai.com/account/billing\n\n${fallbackResult.response} (using fallback mode)`
        };
      }
      
      // For other errors, fall back to pattern matching
      const fallbackResult = this.fallbackProcessCommand(command, currentData);
      return {
        newData: fallbackResult.newData,
        response: `${fallbackResult.response} (OpenAI temporarily unavailable)`
      };
    }
  }

  private executeAction(action: string, parameters: any, currentData: TableData): TableData | null {
    switch (action) {
      case 'add_row':
        if (parameters.values && Array.isArray(parameters.values)) {
          const newRow = parameters.values.map((value: number, index: number) => 
            this.createCell(value, currentData.rows.length, index)
          );
          
          return {
            ...currentData,
            rows: [...currentData.rows, newRow]
          };
        }
        break;

      case 'edit_cell':
        if (typeof parameters.row === 'number' && typeof parameters.col === 'number' && typeof parameters.value === 'number') {
          const newData = { ...currentData };
          newData.rows = newData.rows.map((row, rIdx) =>
            rIdx === parameters.row
              ? row.map((cell, cIdx) =>
                  cIdx === parameters.col ? { ...cell, value: parameters.value } : cell
                )
              : row
          );
          return newData;
        }
        break;

      case 'delete_row':
        if (typeof parameters.row === 'number' && parameters.row >= 0 && parameters.row < currentData.rows.length) {
          return {
            ...currentData,
            rows: currentData.rows.filter((_, index) => index !== parameters.row)
          };
        }
        break;

      case 'add_column':
        const newHeader = parameters.header || `Column ${currentData.headers.length + 1}`;
        return {
          ...currentData,
          headers: [...currentData.headers, newHeader],
          rows: currentData.rows.map(row => [
            ...row,
            this.createCell(Math.floor(Math.random() * 100) + 1, row[0].row, currentData.headers.length)
          ])
        };

      case 'fill_column':
        if (typeof parameters.col === 'number' && typeof parameters.value === 'number') {
          return {
            ...currentData,
            rows: currentData.rows.map(row =>
              row.map((cell, cIdx) =>
                cIdx === parameters.col ? { ...cell, value: parameters.value } : cell
              )
            )
          };
        }
        break;

      default:
        return null;
    }

    return null;
  }

  // Fallback to original pattern matching when OpenAI is not available
  private fallbackProcessCommand(command: string, currentData: TableData): { 
    newData: TableData | null; 
    response: string 
  } {
    const lowerCommand = command.toLowerCase().trim();

    // Add row command: "add row 10, 20, 30" or "add row 10 20 30"
    if (lowerCommand.startsWith('add row')) {
      const numberMatch = lowerCommand.match(/add row\s+(.+)/);
      if (numberMatch) {
        const numbers = numberMatch[1]
          .split(/[,\s]+/)
          .map(n => parseInt(n.trim()))
          .filter(n => !isNaN(n));
        
        if (numbers.length === currentData.headers.length) {
          const newRow = numbers.map((value, index) => 
            this.createCell(value, currentData.rows.length, index)
          );
          
          const newData = {
            ...currentData,
            rows: [...currentData.rows, newRow]
          };
          
          return {
            newData,
            response: `Added new row with values: ${numbers.join(', ')}`
          };
        } else {
          return {
            newData: null,
            response: `Please provide exactly ${currentData.headers.length} values for the new row.`
          };
        }
      }
    }

    // Set cell command: "set row 1 col 2 to 50" or "change row 1 column 2 to 50"
    if (lowerCommand.includes('set row') || lowerCommand.includes('change row')) {
      const cellMatch = lowerCommand.match(/(?:set|change) row (\d+) (?:col|column) (\d+) to (\d+)/);
      if (cellMatch) {
        const rowIndex = parseInt(cellMatch[1]) - 1; // Convert to 0-based index
        const colIndex = parseInt(cellMatch[2]) - 1; // Convert to 0-based index
        const newValue = parseInt(cellMatch[3]);
        
        if (rowIndex >= 0 && rowIndex < currentData.rows.length && 
            colIndex >= 0 && colIndex < currentData.headers.length) {
          
          const newData = { ...currentData };
          newData.rows = newData.rows.map((row, rIdx) =>
            rIdx === rowIndex
              ? row.map((cell, cIdx) =>
                  cIdx === colIndex ? { ...cell, value: newValue } : cell
                )
              : row
          );
          
          return {
            newData,
            response: `Updated row ${rowIndex + 1}, column ${colIndex + 1} to ${newValue}`
          };
        } else {
          return {
            newData: null,
            response: `Invalid row or column index. Use row 1-${currentData.rows.length}, column 1-${currentData.headers.length}.`
          };
        }
      }
    }

    // Delete row command: "delete row 2"
    if (lowerCommand.startsWith('delete row')) {
      const rowMatch = lowerCommand.match(/delete row (\d+)/);
      if (rowMatch) {
        const rowIndex = parseInt(rowMatch[1]) - 1; // Convert to 0-based index
        
        if (rowIndex >= 0 && rowIndex < currentData.rows.length) {
          const newData = {
            ...currentData,
            rows: currentData.rows.filter((_, index) => index !== rowIndex)
          };
          
          return {
            newData,
            response: `Deleted row ${rowIndex + 1}`
          };
        } else {
          return {
            newData: null,
            response: `Invalid row index. Use row 1-${currentData.rows.length}.`
          };
        }
      }
    }

    // Add column command: "add column" or "add column Header"
    if (lowerCommand.startsWith('add column')) {
      const headerMatch = lowerCommand.match(/add column\s+(.+)/);
      const newHeader = headerMatch ? headerMatch[1].trim() : `Column ${currentData.headers.length + 1}`;
      
      const newData = {
        ...currentData,
        headers: [...currentData.headers, newHeader],
        rows: currentData.rows.map(row => [
          ...row,
          this.createCell(Math.floor(Math.random() * 100) + 1, row[0].row, currentData.headers.length)
        ])
      };
      
      return {
        newData,
        response: `Added new column "${newHeader}" with random values`
      };
    }

    // Help command
    if (lowerCommand.includes('help') || lowerCommand === 'commands') {
      const apiStatus = this.getApiStatus();
      let configStatus = "";
      
      switch (apiStatus) {
        case 'configured':
          configStatus = "✅ OpenAI API configured - Enhanced AI available!";
          break;
        case 'quota_exceeded':
          configStatus = "⚠️ OpenAI API quota exceeded - Check your billing at https://platform.openai.com/account/billing";
          break;
        default:
          configStatus = "⚠️ OpenAI API not configured - Add your API key to .env file for enhanced AI.";
      }
      
      return {
        newData: null,
        response: `${configStatus}

Available commands:
• add row [values] - Add a new row with specified values
• set row X col Y to Z - Change a specific cell value
• delete row X - Remove a row
• add column [name] - Add a new column
• fill column X with Y - Fill entire column with value
• help - Show this help message

Examples:
• "add row 10, 20, 30"
• "set row 1 col 2 to 50"
• "delete row 2"

With OpenAI configured, you can also use natural language like:
• "Make the first row all zeros"
• "Add a column for prices"
• "Change all values in column 2 to be double their current value"`
      };
    }

    // Default response for unrecognized commands
    const apiStatus = this.getApiStatus();
    let configHint = "";
    
    switch (apiStatus) {
      case 'quota_exceeded':
        configHint = " (OpenAI quota exceeded - check billing)";
        break;
      case 'not_configured':
        configHint = " (Configure OpenAI API key for better natural language understanding)";
        break;
    }
    
    return {
      newData: null,
      response: `I didn't understand that command${configHint}. Try "help" to see available commands, or use phrases like:
• "add row 10, 20, 30"
• "set row 1 col 2 to 50"
• "delete row 2"`
    };
  }
}