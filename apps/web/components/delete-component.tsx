"use client";

import { api } from "@/lib/api";
import { Button } from "@vibbly/ui/components/button";

// 테스트를 위해 존재하는 컴포넌트
export const DeleteComponent = ({ userId }: { userId: string }) => {
  async function DeleteTest() {
    const commentId = "UgyqCDFfADJnX8TUdxZ4AaABAg";

    const { data } = await api.delete(
      `/api/comments?userId=${userId}&commentId=${commentId}`
    );

    return data;
  }

  return (
    <div>
      <Button onClick={DeleteTest}>delete comments</Button>
    </div>
  );
};
