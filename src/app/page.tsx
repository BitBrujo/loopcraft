import { ChatLayout } from "@/components/chat/ChatLayout";
import { Assistant } from "./assistant";

export default function Home() {
  return (
    <ChatLayout>
      <Assistant />
    </ChatLayout>
  );
}
