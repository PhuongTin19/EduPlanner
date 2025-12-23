
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLessonOutline = async (subject: string, topic: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Tạo một đề cương giáo án cho môn ${subject} với chủ đề: "${topic}". 
      Đề cương nên bao gồm mục tiêu bài học, các hoạt động chính và nội dung cho 5 slide cơ bản. 
      Trả về kết quả bằng tiếng Việt, định dạng Markdown.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating lesson outline:", error);
    return "Không thể tạo đề cương vào lúc này. Vui lòng thử lại sau.";
  }
};

export const parseSheetData = async (rawText: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Bạn là một chuyên gia xử lý dữ liệu giáo dục. Tôi cung cấp dữ liệu copy từ Google Sheet.
      Nhiệm vụ: Phân tích thành cấu trúc 3 cấp: Môn học -> Các Học phần (Danh mục con) -> Các Bài học & Link.
      
      Dữ liệu:
      """
      ${rawText}
      """
      
      Yêu cầu JSON:
      Array<{
        "name": string, // Tên môn học
        "icon": string, // Icon FA phù hợp
        "modules": Array<{
          "name": string, // Tên học phần (nếu sheet không có, hãy tự nhóm hoặc đặt là "Chung")
          "lessons": Array<{
            "name": string,
            "url": string
          }>
        }>
      }>`,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error parsing sheet data:", error);
    throw new Error("Không thể phân tích dữ liệu phân cấp.");
  }
};
