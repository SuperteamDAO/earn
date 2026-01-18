'use client';

import { cn } from '@/utils/cn';

import TestimonialCard from '../cards/TestimonialCard';

// All 30 testimonials from i18n/en.json
const testimonials = [
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1394116783792025603/jTMcoZRY_normal.jpg',
    name: 'Phantom',
    username: '@phantom',
    content:
      'Few.\n\nShout-out to @SuperteamEarn and @SuperteamDAO for onboarding devs around the world into the ecosystem! 🤝 https://t.co/78iAaIeXld',
    tweet_link: 'https://twitter.com/phantom/status/1612903184607088640',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1643934583933607937/Ll4jeeUE_normal.jpg',
    name: 'Austin Federa | 🛡️',
    username: '@Austin_Federa',
    content:
      'Superteam Earn is quietly becoming a powerful force for growth in the ecosystem 🔥 https://t.co/vKmNhkMdYi',
    tweet_link: 'https://twitter.com/Austin_Federa/status/1613894970070401024',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1432433101158993920/ZDTDNbHQ_normal.jpg',
    name: 'Kanav Kariya',
    username: '@KanavKariya',
    content:
      "@mattysino @YouTube Sir, you are too kind. Everyone should check out @SuperteamDAO. They're doing some really dope stuff",
    tweet_link: 'https://twitter.com/KanavKariya/status/1469529023583637505',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1472933274209107976/6u-LQfjG_normal.jpg',
    name: 'Solana',
    username: '@solana',
    content:
      "6/ Once you've got the basics down, Questbook and @SuperTeamDAO have a great list of tutorials to improve your Solana development skills. https://t.co/UlKgWiXXqk",
    tweet_link: 'https://twitter.com/solana/status/1483315583752015873',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/432677761011159040/N4hUsNjB_normal.jpeg',
    name: 'Lily Liu',
    username: '@calilyliu',
    content:
      'Amazing community, incredible energy, excellent event. Thanks @SuperteamDAO and @SolanaFndn !  Enjoyed days of bakchod banter with @akshaybd and @thetanmay https://t.co/CRVBqDiByz',
    tweet_link: 'https://twitter.com/calilyliu/status/1572335926612824067',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1503437573917757446/lb7nV4mA_normal.jpg',
    name: 'Solana Developers',
    username: '@solana_devs',
    content:
      ".@SuperteamDAO has facilitated the growth of @solana communities around the globe starting in India over a year ago. They've created a product (https://t.co/epusyf8ABE) that allows anyone to earn their first salary in crypto. The GDP of Superteam has now reached $1 million! https://t.co/GNedWKSGfz",
    tweet_link: 'https://twitter.com/solana_devs/status/1602649231344521217',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1586011168488947715/PNMJv9ZT_normal.jpg',
    name: 'Solana Breakpoint ☀️ AMSTERDAM Oct. 30-Nov.3',
    username: '@SolanaConf',
    content:
      '"I\'m building this school to bring fellow Sierra Leoneans opportunity" - @c_ogoo \n\nThe average Sierra Leonean earns $40-60/month. A senior SWE earns ~$300/month.\n\nA single @SuperteamDAO bounty could 3-5x someone\'s monthly earnings.',
    tweet_link: 'https://twitter.com/SolanaConf/status/1589248034080100352',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1586011168488947715/PNMJv9ZT_normal.jpg',
    name: 'Solana Breakpoint ☀️ AMSTERDAM Oct. 30-Nov.3',
    username: '@SolanaConf',
    content:
      "\"It's amazing how many people are pushing forward that we never even knew about, and a lot of it's international. @SuperteamDAO put @solana on the map in India. There's a one man army running 20 hackathons in Mexico.\n\nIt's a global movement.\" - @rajgokal https://t.co/iofq5okmMl",
    tweet_link: 'https://twitter.com/SolanaConf/status/1589688383311605760',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1628457065747193859/94PkLn0S_normal.jpg',
    name: 'Mad Armani 🎒',
    username: '@armaniferrante',
    content: '@akshaybd Superteam is leading the way 🫡',
    tweet_link: 'https://twitter.com/armaniferrante/status/1636224109716688896',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1643840853171920896/F5a48UUH_normal.jpg',
    name: 'Based Charker',
    username: '@therealchaseeb',
    content:
      'While he wrote the playbook, the rest of the team pitches in and supports them to drive the numbers you see today. Fun fact, outside of the US, the top number of submissions came from countries that have been activated with a @SuperteamDAO!',
    tweet_link: 'https://twitter.com/therealchaseeb/status/1636735285106036736',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1637276996530057216/qVezsmAV_normal.jpg',
    name: 'thelawrenceyan☉🌊💹',
    username: '@thelawrenceyan',
    content: 'yo wtf\n\n@SuperteamDAO rn https://t.co/wFvi8BB32I',
    tweet_link: 'https://twitter.com/thelawrenceyan/status/1623975469094940675',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1621554312840384512/AQy7lqRY_normal.jpg',
    name: 'Aditya Mallik',
    username: '@mallikadityagfx',
    content:
      'As a student I had worked as an intern, did some small local gigs for basically no money! \nBut through @SuperteamDAO it changed it all!\nNow I am working with some top @solana projects, earning real money while still being a student and sitting in my home!\n#gdpgdpgdp https://t.co/lt6uqnMfqf',
    tweet_link:
      'https://twitter.com/mallikadityagfx/status/1602647767863918592',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1642485189002813441/MNzUBbVO_normal.jpg',
    name: 'Paarug Sethi',
    username: '@paarugsethi',
    content:
      "Got my first gig in web3 via superteam's job board when it was just a podcast.\n\nI was there when the discord formed & community GDP became a thing.\n\nEvery opportunity I've gotten ever since has been directly/indirectly been related to this group. Forever grateful.❤️\n\n#GDPGDPGDP https://t.co/jzoVCyv4ft",
    tweet_link: 'https://twitter.com/paarugsethi/status/1602634482171117568',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1642485189002813441/MNzUBbVO_normal.jpg',
    name: 'Paarug Sethi',
    username: '@paarugsethi',
    content:
      '4 countries out of the top 5 have a superteam. coincidence?👀 https://t.co/VE4kPdzcZg',
    tweet_link: 'https://twitter.com/paarugsethi/status/1604098355881476096',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1530063533307637761/yxZJ_xMS_normal.jpg',
    name: 'shek',
    username: '@shek_dev',
    content:
      "💯 this. If it weren't for @akshaybd and @SuperteamDAO I wouldn't have founded @wordcel_club as a company. https://t.co/7ryBI3Aykw",
    tweet_link: 'https://twitter.com/shek_dev/status/1588070390173155329',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1135982031358140417/vTHIIEAl_normal.png',
    name: 'Yash Agarwal',
    username: '@yashhsm',
    content:
      '🚨 Update: Going full-time in Web3🚀\n\nFrom deploying 1st ETH smart contract in 2018 to observing from the sidelines for 3 years. Getting into @SuperteamDAO in 2021, not just revived my Web3 journey, but pushed me to build my own Web3 project!\n\nThread on my Web3 journey🧵👇',
    tweet_link: 'https://twitter.com/yashhsm/status/1566789436892819456',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1482991753418670081/2deGomxC_normal.jpg',
    name: 'Het Dagli🔥💃',
    username: '@daglihet',
    content:
      'Started my @SuperteamDAO journey by winning a writing bounty exactly a year ago.\n\nMade amazing friends, learned so much, and finally took the leap of faith, left my Web2 job to work for guys I got introduced through @SuperteamDAO \n\nGrateful for this amazing community.#gdpgdpgdp',
    tweet_link: 'https://twitter.com/daglihet/status/1602632709477732352',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1527161976127770624/oGO8jrdN_normal.jpg',
    name: 'Kunal Bagaria',
    username: '@kb24x7',
    content:
      'From joining a Discord invite link shared by @thetanmay  to speaking at one of the largest crypto conferences. The journey has been absolutely incredible!\n\n@SuperteamDAO #gdpgdpgdp https://t.co/xsg3qKzDY1',
    tweet_link: 'https://twitter.com/kb24x7/status/1602626850068770816',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1504484728833208324/o_alF-mZ_normal.png',
    name: 'Bolt / Aabis',
    username: '@0xBolt',
    content:
      'I joined @SuperteamDAO about an year ago and that changed my life dramatically.\nFrom being a random high school kid to earning, building and winning. There were burnouts, there were work intensive times, however the journey was worth it! #GDPGDPGDP',
    tweet_link: 'https://twitter.com/0xBolt/status/1602686698206498816',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1637364801201659909/lNjO0hkl_normal.jpg',
    name: 'Ujjwal Gupta',
    username: '@ujjwalgupta49',
    content:
      "With @SuperteamDAO I've been able to ship better products, get access to the best minds and create value for other members.\n\nContinuing the journey I help builder at @SuperteamVN and onboard the best minds to @solana.",
    tweet_link: 'https://twitter.com/ujjwalgupta49/status/1602625570935898113',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1538634883236786176/DLIa0dJO_normal.jpg',
    name: 'Rakshit⚡️',
    username: '@rakshitbaveja',
    content:
      'Today exactly a year back, I wrote this thread which got me in @SuperteamDAO as a member ANDD a full time job @0xPolygon.\n\nI never looked back. I was working at TCS when I wrote it, today I get to work with some of the best people on CT. \n\nINTERNET REMAINS UNDEFEATED :) https://t.co/cQex84gYIf',
    tweet_link: 'https://twitter.com/rakshitbaveja/status/1609165260627513345',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1641102323614355456/TCyPUefa_normal.jpg',
    name: 'CM 👾| Monstré',
    username: '@cm_monstre',
    content:
      'Expressing my gratitude towards the community and team at @SuperteamDAO. A reflection on my experience since joining their community a few weeks ago. https://t.co/yLksEmTCzq',
    tweet_link: 'https://twitter.com/cm_monstre/status/1619267692002951168',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1641904504688762880/NJm0WYLH_normal.png',
    name: 'DeanTheMachine',
    username: '@_Dean_Machine',
    content: 'Superteam never misses! https://t.co/lMRta2zkXc',
    tweet_link: 'https://twitter.com/_Dean_Machine/status/1622499350684266497',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1613087186932596736/cJiIPd2s_normal.jpg',
    name: 'Solscan',
    username: '@solscanofficial',
    content:
      '#Solana Coding Camp Season 2️⃣ is back🚀 \n\n🇻🇳 BUIDL-ers, we have high hopes for you🎉 A special shout out to @SuperteamVN @SentreProtocol @coin98_wallet teams you guys are awesome❤️\n\nMore info ▶️ https://t.co/J6CBlsttIU https://t.co/laXvJeIte9',
    tweet_link:
      'https://twitter.com/solscanofficial/status/1580210338359713798',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1533626020913610752/3pnIbGtj_normal.jpg',
    name: 'Anh Tran',
    username: '@SaigonButcher',
    content:
      "@hackerhouses Vietnam was by far the best web3 events I've ever attended in my life. \n\nWay too many people to thank for making this such an amazing experience.\n-@SolanaFndn for believing in VN \n-All the event organizers and @SuperteamVN  for making everything run so smooth https://t.co/WdvrXVf3e7",
    tweet_link: 'https://twitter.com/SaigonButcher/status/1637732506211434497',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1638116982464626690/CRM-ZTwU_normal.jpg',
    name: 'Diksha Dutta',
    username: '@dikshadutta',
    content:
      'Moderated my first event of 2023 for @SuperteamDE   with so much women power on stage 🔥\n\nLovely meeting you all IRL and getting to know your Web3 journeys: @Dr_Revel_NFT @ZoeCatherineF  @thealbrechteli @cyberkwin  ❤️\n\nand ofc thanks to the queen @tamarincrypto 👑 https://t.co/s1KrGFcwIo',
    tweet_link: 'https://twitter.com/dikshadutta/status/1632693624403111936',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1493780156971839493/zzKhk7wM_normal.jpg',
    name: 'gulcan yayla',
    username: '@gulcan_yayla',
    content:
      "The world is full of opportunities no matter where you are, and @SuperteamTR is bringing these to Turkey. Super proud today ❤️\nWe are waiting for anyone who want to build projects on Solana. Pls reach out and let's put Turkey to the top of the talent charts!\nLet's go! ❤️‍🔥 https://t.co/DDXGQcJhCV",
    tweet_link: 'https://twitter.com/gulcan_yayla/status/1595827819984060417',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1622893289962631170/MsVS8Ygw_normal.jpg',
    name: 'Lunapark Web3 Hub 🎡',
    username: '@lunaparkhub',
    content:
      ".@SuperteamTR ve @patika_dev Türkiye web3 ekosistemini geliştirmek için @lunaparkhub'ta etkinliklere devam ediyor!\n\nSolana Global Hackathon'da en çok proje sunan ilk 5 ülkeden biri olmak için hep beraber kolları sıvadık! 🥳\n\northaya güzel dostluklar, takımlar ve projeler çıktı!💙 https://t.co/6tB25L22jL",
    tweet_link: 'https://twitter.com/lunaparkhub/status/1632775366430322691',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1621304487120982023/iWCdJOoP_normal.jpg',
    name: 'Superteam Germany',
    username: '@SuperteamDE',
    content:
      "That's a wrap! Berlin Build Station has come to an end.\n\nWith more than 800 attendees, 60 Grizzlython projects, and 2000 bottles of beer, it's a huge W for the German @Solana ecosystem🇩🇪\n\nLet's see what happened👇 https://t.co/wIsSxZTVxQ",
    tweet_link: 'https://twitter.com/SuperteamDE/status/1637762413809512448',
  },
  {
    imgurl:
      'https://pbs.twimg.com/profile_images/1406974882919813128/LOUb2m4R_normal.jpg',
    name: 'Balaji',
    username: '@balajis',
    content:
      "A new hackathon on DAOs and network states.\n$100k in prizes, open globally.\nHosted by Superteam, organized by Solana Foundation.\nI'll be judging the winners. https://t.co/DMstV6HbTp",
    tweet_link: 'https://twitter.com/balajis/status/1621194597249740803',
  },
];

interface LoveRespectProps {
  collab?: boolean;
}

export default function LoveRespect({ collab = false }: LoveRespectProps) {
  // Pair testimonials for vertical stacking (2 per column)
  const pairedTestimonials: Array<
    [(typeof testimonials)[0], (typeof testimonials)[0] | undefined]
  > = [];
  for (let i = 0; i < testimonials.length; i += 2) {
    const first = testimonials[i];
    if (first) {
      pairedTestimonials.push([first, testimonials[i + 1]]);
    }
  }

  return (
    <div
      className={cn(
        'respect-container relative right-1/2 left-1/2 col-span-5 mt-[224px] h-fit w-screen -translate-x-1/2 overflow-x-visible md:h-fit',
        collab ? 'lg:mt-[224px]' : '',
      )}
    >
      <div className="love-header">
        <p className="love section-heading text-[24px] leading-[26px] md:text-[32px] lg:leading-[35px]">
          Love and Respect
        </p>
      </div>

      <div className="scrollbar-hidden item-container mt-12 flex-nowrap overflow-x-scroll">
        <div className="scroll-wrapper grid w-full">
          {/* Row 1 */}
          <div className="item-row item-row-1 flex flex-row">
            {pairedTestimonials.map((pair, index) => (
              <div
                key={`row1-${index}`}
                className="item-col flex h-fit flex-row md:flex-col"
              >
                <div className="testimonial-item">
                  <TestimonialCard
                    imgurl={pair[0].imgurl}
                    name={pair[0].name}
                    username={pair[0].username}
                    content={pair[0].content}
                    twturl={pair[0].tweet_link}
                  />
                </div>
                {pair[1] && (
                  <div className="testimonial-item">
                    <TestimonialCard
                      imgurl={pair[1].imgurl}
                      name={pair[1].name}
                      username={pair[1].username}
                      content={pair[1].content}
                      twturl={pair[1].tweet_link}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Row 2 - Duplicate for infinite scroll */}
          <div className="item-row item-row-2 flex flex-row">
            {pairedTestimonials.map((pair, index) => (
              <div
                key={`row2-${index}`}
                className="item-col flex h-fit flex-row md:flex-col"
              >
                <div className="testimonial-item">
                  <TestimonialCard
                    imgurl={pair[0].imgurl}
                    name={pair[0].name}
                    username={pair[0].username}
                    content={pair[0].content}
                    twturl={pair[0].tweet_link}
                  />
                </div>
                {pair[1] && (
                  <div className="testimonial-item">
                    <TestimonialCard
                      imgurl={pair[1].imgurl}
                      name={pair[1].name}
                      username={pair[1].username}
                      content={pair[1].content}
                      twturl={pair[1].tweet_link}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Row 3 - Only visible on large screens */}
          <div className="item-row item-row-3 hidden flex-row lg:flex">
            {pairedTestimonials.map((pair, index) => (
              <div
                key={`row3-${index}`}
                className="item-col flex h-fit flex-row md:flex-col"
              >
                <div className="testimonial-item">
                  <TestimonialCard
                    imgurl={pair[0].imgurl}
                    name={pair[0].name}
                    username={pair[0].username}
                    content={pair[0].content}
                    twturl={pair[0].tweet_link}
                  />
                </div>
                {pair[1] && (
                  <div className="testimonial-item">
                    <TestimonialCard
                      imgurl={pair[1].imgurl}
                      name={pair[1].name}
                      username={pair[1].username}
                      content={pair[1].content}
                      twturl={pair[1].tweet_link}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
