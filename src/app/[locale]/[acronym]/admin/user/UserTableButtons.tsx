"use client";

import { TooltipActionButton } from "@/components/Buttons/TooltipIconButton";
import { useParams, useSearchParams, useRouter } from "next/navigation";



export const OpenNewUserButton = () => {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const onClick = () => {
        router.push(`/${params.locale}/app/admin/user?open=new`);
    }

    return (
        <TooltipActionButton
            variantKey="create"
            onClick={onClick}
            disabled={searchParams.has("open")}
        />
    );
}

export const OpenUserButton = ({ userId }: { userId: string }) => {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const onClick = () => {
        router.push(`/${params.locale}/app/admin/user?open=${userId}`);
    }

    return (
        <TooltipActionButton
            variantKey="open"
            onClick={onClick}
            disabled={searchParams.has("open")}
        />
    );
}