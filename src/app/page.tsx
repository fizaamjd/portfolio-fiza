"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import IdentityPortfolio from "@/components/home/IdentityPortfolio";
const GameShell=dynamic(()=>import("@/components/game/GamePortfolio"));
export default function Home(){
  const [playing,setPlaying]=useState(false);
  useEffect(()=>{const sync=()=>setPlaying(location.hash==='#play');sync();window.addEventListener('hashchange',sync);window.addEventListener('popstate',sync);return()=>{window.removeEventListener('hashchange',sync);window.removeEventListener('popstate',sync);};},[]);
  const go=useCallback((play:boolean)=>{setPlaying(play);window.history.pushState(null,'',play?'#play':'#top');window.scrollTo({top:0,behavior:'instant'});},[]);
  return playing?<GameShell onExit={()=>go(false)}/>:<IdentityPortfolio onPlay={()=>go(true)}/>;
}
