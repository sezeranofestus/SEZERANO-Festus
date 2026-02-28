import { Session } from "@google/genai";
const session: Session = {} as any;
session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "Hello" }] }] });
