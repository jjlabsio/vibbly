import { format } from "date-fns";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const baseUrl = `http://localhost:3000`;

  const { id } = await params;
  const response = await fetch(`${baseUrl}/api/comment-threads`);

  if (!response.ok) {
    return notFound();
  }

  const data = await response.json();

  console.log("data :>> ", data);

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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "yyyy-MM-dd HH:mm:ss");
  };

  return (
    <div>
      <div>My Post: {id}</div>
      <div>
        {list.map((el, index) => (
          <div className="flex gap-5 my-2 border-b" key={index}>
            <div className="w-[250px] shrink-0">
              {formatDate(el.snippet.topLevelComment.snippet.publishedAt)}
            </div>
            <div className="flex-1 break-words">
              {el.snippet.topLevelComment.snippet.textOriginal}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
