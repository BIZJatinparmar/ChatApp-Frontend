import { useQuery } from "@tanstack/react-query";
import { listConversations } from "../api/conversations";

export function useConversations() {
    return useQuery({
        queryKey: ["conversations"],
        queryFn: ({ signal }) => {
            return listConversations(signal)
        },
    });
}