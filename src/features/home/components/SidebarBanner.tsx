// const base = `/hackathon/breakout/`;
// const baseAsset = (filename: string) => base + filename;

// interface SidebarPosterProps {
//   className?: string;
// }

// export function SidebarBannerBreakout({ className }: SidebarPosterProps) {
//   // const { data: stats } = useQuery(statsDataQuery(slug));
//   return (
//     <Link href="/hackathon/breakout">
//       <div
//         className={`relative flex h-[21.125rem] w-full flex-col items-center overflow-hidden rounded-xl border border-white/20 ${className}`}
//       >
//         <ExternalImage
//           src={baseAsset('sidebar-bg')}
//           alt="Breakout Hackathon"
//           className="absolute top-0 left-0 h-full w-full object-cover"
//         />

//         <div className="relative z-10 flex h-full w-full flex-col px-4 pt-6 pb-4 text-black">
//           <div className="flex items-center justify-between px-4">
//             <BreakoutLogo className="h-[10.8125rem]" />
//           </div>
//           <div
//             className={`${animeAce.className} flex flex-col items-center justify-center`}
//           >
//             <p className="text-xs italic">
//               Submissions Due May 16 (11:59PM PST)
//             </p>
//             <p className="pt-1 text-lg font-bold">
//               $300K+ in side tracks
//               {/* ${stats?.totalRewardAmount.toLocaleString('en-us') ?? '-'} in side */}
//             </p>
//           </div>

//           <Button
//             variant="secondary"
//             className={`${animeAce.className} mt-auto mb-2 w-full rounded-md bg-black text-base font-bold text-white hover:bg-black/70`}
//           >
//             SUBMIT NOW
//           </Button>
//         </div>
//       </div>
//     </Link>
//   );
// }
