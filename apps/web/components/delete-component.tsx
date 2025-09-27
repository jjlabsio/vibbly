"use client";

import { Button } from "@vibbly/ui/components/button";
import { notFound } from "next/navigation";

// 테스트를 위해 존재하는 컴포넌트
export const DeleteComponent = ({ userId }: { userId: string }) => {
  async function DeleteTest() {
    const commentId = "UgyqCDFfADJnX8TUdxZ4AaABAg";
    const response = await fetch(
      `/api/comments?userId=${userId}&commentId=${commentId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      return notFound();
    }

    const data = await response.json();

    return data;
  }

  return (
    <div>
      <Button onClick={DeleteTest}>delete comments</Button>
    </div>
  );
};
