import * as Lucide from "lucide-react";
import { JSX } from "react";

export type Icon = (props: Lucide.LucideProps) => JSX.Element;

export const Bell = Lucide.Bell;
export const ChartArea = Lucide.ChartArea;
export const ChevronLeft = Lucide.ChevronLeft;
export const ChevronsLeft = Lucide.ChevronsLeft;
export const ChevronRight = Lucide.ChevronRight;
export const ChevronsRight = Lucide.ChevronsRight;
export const Copy = Lucide.Copy;
export const Gem = Lucide.Gem;
export const Languages = Lucide.Languages;
export const List = Lucide.List;
export const LogOut = Lucide.LogOut;
export const MessageCircleMore = Lucide.MessageCircleMore;
export const Moon = Lucide.Moon;
export const MoreHorizontal = Lucide.MoreHorizontal;
export const Settings = Lucide.Settings;
export const SquarePen = Lucide.SquarePen;
export const Sun = Lucide.Sun;
export const Trash2 = Lucide.Trash2;

export const Youtube: Icon = (props) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>YouTube</title>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
