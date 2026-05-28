import { useNavigate } from "react-router";
import { InputBox } from "../components/InputBox";
import { PromptSuggestions } from "../components/PromptSuggestion";
import { apiFetch } from "../api/client";
import { useMutation } from "@tanstack/react-query";

export function Home() {
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: async (text: string) => {
      const id = crypto.randomUUID();
      await apiFetch("/conversations", {
        method: "POST",
        body: {
          id: id,
          title: "",
        },
      });
      return { id, text };
    },
    onSuccess: ({ id, text }) => {
      navigate(`/c/${id}`, {
        state: {
          message: text,
          new: true,
        },
      });
    },
  });

  return (
    <div className="flex-1 overflow-y-auto w-full flex flex-col items-center px-4 sm:px-6 pb-20">
      <div className="w-full max-w-[800px] mt-[102px] sm:mt-[153px] flex flex-col items-center">
        <h1 className="text-[40px] font-semibold text-[#1b1b1b] mb-12 text-center tracking-tight leading-[1.2]">
          How can I help you today?
        </h1>
        <InputBox onSubmit={(text) => mutate(text)} isPending={isPending} />
        <PromptSuggestions onSelect={(text) => mutate(text)} />
      </div>
    </div>
  );
}
