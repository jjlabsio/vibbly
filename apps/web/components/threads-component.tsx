import { api } from "@/lib/api";

export const ThreadsComponent = async () => {
  const { data } = await api.get(`/api/comment-threads`);

  const list = data as {
    etag: string;
    snippet: {
      topLevelComment: {
        snippet: {
          publishedAt: string;
          textOriginal: string;
        };
      };
    };
  }[];

  return (
    <div>
      {list.map((el, index) => (
        <div className="flex gap-5 my-2 border-b" key={index}>
          <div className="flex-1 break-words">
            {el.snippet.topLevelComment.snippet.textOriginal}
          </div>
        </div>
      ))}
    </div>
  );
};
