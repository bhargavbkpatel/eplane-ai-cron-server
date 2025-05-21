import OpenAI from "openai";
import { OPENAI_API_KEY } from "../config/env.config";
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export async function textToMarkdown(content: string) {
  try {
    const prompt = `
      You are a helpful assistant that converts news article content into clean, well-structured Markdown format.
      Please follow these instructions carefully:
      1. **Do not change any words** from the original content. Keep all text exactly as it is.
      2. If the content is already in Markdown format, return it as-is without modification.
      3. Do **not** use H1 headings (#). If the content includes H1 headings, convert them to H2 or lower (##, ###, etc.).
      4. Do **not** include horizontal rules or thematic breaks (e.g., ---, ***, ___).
      5. Convert any numbered reference links (e.g., [1], [2], [5]) or HTML anchor tags into proper inline Markdown links with **descriptive, meaningful anchor text**.
      6. Do **not** leave any link text as just numbers (e.g., [1]); replace them with the actual link context.
      7. Remove all reference-style links or footnotes from the bottom of the content, incorporating the link directly inline instead.
      8. Preserve all original paragraph breaks and line structure. Do not merge or split paragraphs.
      9. Maintain proper spacing and indentation for readability. Avoid excessive whitespace that could trigger React hydration issues.
      10. If the content is short, **improve its readability** by:
          - Using **subheadings** (## or ###) to break up the information logically
          - Highlighting **key data points or statistics** using bold text
          - Using **bullet points** to list facts, companies, comparisons, or outcomes
          - Separating different themes (e.g., comparison vs. trend) into individual sections
      11. Ensure all Markdown syntax is valid and well-structured:
          - Use backticks (\`) for inline code, if present.
          - Use triple backticks (\`\`\`) with language identifiers for code blocks, if any.
          - Lists (ordered or unordered) should be properly indented and consistently formatted.
          - Blockquotes (>) should maintain original structure without alteration of content.
      12. Do not add any new text, summaries, commentary, or formatting beyond what is required for Markdown conversion.
      13. Ensure all plain links (e.g., http://example.com) are converted to **Markdown links only**, not as images. Use the format [link text](http://example.com).
      14. Convert any image links (e.g., direct URLs ending in .jpg, .png, .gif) to Markdown image syntax using the format "![alt text](image URL)".
      15. Check if the link is an image or URL—use ![alt text](link) for images and [label](link) for regular URLs; this step is important, so don't forget.
      16. **Remove any copyright statements, copyright notices, or boilerplate copyright disclaimers (such as "© 2025 Example News, All Rights Reserved", "Copyright 2025 by [Publisher]", or similar legal copyright text) found anywhere in the content while converting to Markdown. Do not remove or alter any other part of the article.**
      17. **Ignore and omit any links (including images) that use "example.com", "example.org", "example.net", "test.com", "dummy.com", or any other domain that appears to be a placeholder, dummy, or test URL. Do not include these links in the output at all.**

      CUT-OFF CHECK:
        - If the content appears cut off (e.g., incomplete sentence or ending mid-thought), add **1–2 lines** that:
          - Match the author’s tone, vocabulary, and sentence structure
          - Continue the last paragraph naturally
          - Do NOT summarize or add commentary — just extend the thought

        IMPORTANT:
        - Do not modify the original content except for Markdown formatting
        - Only add continuation lines **if the last sentence is incomplete or abruptly ends**
        - Do not add extra text if the article ends clearly or already has a conclusion

        TASK:
        Convert the following article content into Markdown with the rules above. If the content ends mid-thought, add 1–2 seamless lines to complete it.
        
      Here is the content to convert:
      ${content}
  `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    return response?.choices[0]?.message?.content;
  } catch (error) {
    console.error("Failed to convert text to markdown", error);
    throw error;
  }
}
