import { storage } from "./storage";
import { generateQuestions } from "./openai";

interface ParsedCommand {
  type: "create_template" | "create_exam" | "view_performance" | "help" | "unknown";
  data?: any;
}

export async function parseCommand(message: string): Promise<ParsedCommand> {
  const lowercaseMessage = message.toLowerCase();
  
  // Template creation intent
  if (lowercaseMessage.includes("create template") || 
      lowercaseMessage.includes("new template") ||
      lowercaseMessage.includes("make template")) {
    return {
      type: "create_template",
      data: {
        extractedInfo: extractTemplateInfo(message)
      }
    };
  }
  
  // Exam creation intent
  if (lowercaseMessage.includes("create exam") || 
      lowercaseMessage.includes("generate exam") ||
      lowercaseMessage.includes("new exam")) {
    return {
      type: "create_exam",
      data: {
        extractedInfo: extractExamInfo(message)
      }
    };
  }
  
  // Performance view intent
  if (lowercaseMessage.includes("show performance") || 
      lowercaseMessage.includes("view results") ||
      lowercaseMessage.includes("check score") ||
      lowercaseMessage.includes("how did") ||
      lowercaseMessage.includes("performance")) {
    return {
      type: "view_performance",
      data: {
        extractedInfo: extractPerformanceInfo(message)
      }
    };
  }
  
  // Help intent
  if (lowercaseMessage.includes("help") || 
      lowercaseMessage.includes("what can you do") ||
      lowercaseMessage.includes("how to")) {
    return {
      type: "help"
    };
  }
  
  return { type: "unknown" };
}

function extractTemplateInfo(message: string) {
  // Extract subject, grade, curriculum info from message
  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology"];
  const grades = ["8", "9", "10", "11", "12"];
  
  const extractedInfo = {
    subject: subjects.find(subject => 
      message.toLowerCase().includes(subject.toLowerCase())
    ),
    grade: grades.find(grade => 
      message.includes(grade)
    ),
    // Add more extracted fields as needed
  };
  
  return extractedInfo;
}

function extractExamInfo(message: string) {
  // Similar to template info extraction but for exam-specific details
  return {};
}

function extractPerformanceInfo(message: string) {
  // Extract user, subject, date range info for performance queries
  return {};
}

export async function generateResponse(command: ParsedCommand, message: string): Promise<string> {
  switch (command.type) {
    case "create_template":
      if (!command.data?.extractedInfo?.subject || !command.data?.extractedInfo?.grade) {
        return `I can help you create a template. Could you please specify:
- Subject (e.g., Mathematics, Physics)
- Grade level (8-12)
- Any specific format preferences?`;
      }
      return `I'll help you create a template for ${command.data.extractedInfo.subject} (Grade ${command.data.extractedInfo.grade}). What type of questions would you like to include?`;
      
    case "create_exam":
      return `I can help you generate an exam. Please provide:
- Subject
- Grade level
- Difficulty level (Beginner to Olympiad)
- Number of questions or total marks`;
      
    case "view_performance":
      return `I'll help you check performance analytics. Would you like to see:
- Overall performance summary
- Subject-wise analysis
- Recent exam results
- Improvement trends`;
      
    case "help":
      return `I can help you with:
- Creating question templates
- Generating exams from templates
- Viewing performance analytics
- Getting personalized learning assistance

Just tell me what you'd like to do in natural language, and I'll guide you through the process.`;
      
    case "unknown":
    default:
      return "I'm not sure what you'd like to do. You can ask me to create templates, generate exams, or view performance analytics. What would you like to do?";
  }
}
