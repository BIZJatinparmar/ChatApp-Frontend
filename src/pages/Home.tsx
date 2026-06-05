import { useNavigate } from "react-router";
import { InputBox } from "../components/InputBox";
import { PromptSuggestions } from "../components/PromptSuggestion";
import { createConversation } from "../api/conversations";
import { useMutation } from "@tanstack/react-query";
import { useChatStreams } from "../hooks/useSendMessage";

export function Home() {
  const navigate = useNavigate();
  const { sendMessage } = useChatStreams();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      text,
      modelId,
    }: {
      text: string;
      modelId: string;
    }) => {
      const id = crypto.randomUUID();
      await createConversation(id);
      void sendMessage(id, text, modelId).catch(() => undefined);
      return { id };
    },
    onSuccess: ({ id }) => {
      navigate(`/c/${id}`);
    },
  });

  return (
    <div className="flex-1 overflow-y-auto w-full flex flex-col items-center px-4 sm:px-6 pb-20">
      <div className="w-full max-w-[800px] mt-[102px] sm:mt-[153px] flex flex-col items-center">
        <h1 className="text-[40px] font-semibold text-[#1b1b1b] mb-12 text-center tracking-tight leading-[1.2]">
          How can I help you today?
        </h1>
        <InputBox
          onSubmit={(text, modelId) => mutate({ text, modelId })}
          isPending={isPending}
        />
        <PromptSuggestions
          onSelect={(text) => mutate({ text, modelId: "gpt-5-nano" })}
        />
      </div>
    </div>
  );
}
