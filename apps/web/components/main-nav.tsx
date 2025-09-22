import { Link } from "@/i18n/navigation";

export function MainNav() {
  return (
    <div className="flex gap-6 md:gap-10">
      <div className="flex items-center">
        <Link
          href={`/projects`}
          className="hidden items-center space-x-2 md:flex"
        >
          <div className="text-xl">Vibbly</div>
        </Link>
      </div>
    </div>
  );
}
