import { notFound } from "next/navigation";

async function getCommentThreads() {
  const baseUrl = `http://localhost:3000`;
  const response = await fetch(`${baseUrl}/api/comment-threads`);

  if (!response.ok) {
    return notFound();
  }

  const data = await response.json();

  return data;
}

export const ThreadsComponent = async () => {
  const data = await getCommentThreads();
  const list = data.items as {
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
