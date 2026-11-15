"use client";
import dynamic from 'next/dynamic';
import {useCallback,useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {GAME_PROJECTS,type MoveDirection} from '@/lib/game/world';
import type {Project} from '@/lib/data';
import ProjectPanel from '@/components/projects/ProjectPanel';
const Scene=dynamic(()=>import('@/components/game/PaperGameScene'),{ssr:false});
const STORE='fiza-paper-world-collection-v1';
function subscribe(notify:()=>void){const mq=matchMedia('(prefers-reduced-motion: reduce)');mq.addEventListener('change',notify);return()=>mq.removeEventListener('change',notify);}
function readCollection():string[]{try{const value=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(value)?value.filter((id:unknown)=>typeof id==='string'&&GAME_PROJECTS.some(p=>p.id===id)):[];}catch{return [];}}
function Arrow({direction='right'}:{direction?:MoveDirection}){return <svg viewBox="0 0 24 24" aria-hidden="true" style={{transform:`rotate(${({right:0,down:90,left:180,up:270})[direction]}deg)`}}><path d="M5 12h14m-6-6 6 6-6 6"/></svg>;}
function Mark({kind}:{kind:'close'|'check'|'empty'}){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={kind==='close'?'m6 6 12 12M18 6 6 18':kind==='check'?'m6 12 4 4 8-9':'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z'}/></svg>;}
export default function GamePortfolio({onExit}:{onExit:()=>void}){
  const [unlocked,setUnlocked]=useState<string[]>(readCollection),[latest,setLatest]=useState<string|null>(null),[open,setOpen]=useState<Project|null>(null),[indexOpen,setIndexOpen]=useState(false),[paused,setPaused]=useState(false),[ready,setReady]=useState<boolean|null>(null),[destination,setDestination]=useState<number|null>(null),[travelKey,setTravelKey]=useState(0),[direction,setDirection]=useState<MoveDirection|null>(null),[muted,setMuted]=useState(false),[mapView,setMapView]=useState(false);
  const root=useRef<HTMLDivElement>(null),indexButton=useRef<HTMLButtonElement>(null),collected=useRef(new Set(unlocked));
  const reduced=useSyncExternalStore(subscribe,()=>matchMedia('(prefers-reduced-motion: reduce)').matches,()=>false);
  const focusWorld=()=>requestAnimationFrame(()=>root.current?.querySelector<HTMLElement>('.paper-game-scene')?.focus({preventScroll:true}));
  const collect=useCallback((id:string)=>{if(collected.current.has(id))return;collected.current.add(id);const values=[...collected.current];setUnlocked(values);setLatest(id);try{localStorage.setItem(STORE,JSON.stringify(values));}catch{/* The game remains playable with browser storage disabled. */}},[]);
  const openProject=useCallback((id:string)=>{const project=GAME_PROJECTS.find(p=>p.id===id);if(project)setOpen(project);setDirection(null);},[]);
  const travel=(index:number)=>{setDestination(index);setTravelKey(n=>n+1);setIndexOpen(false);focusWorld();};
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key.toLowerCase()!=='m'||e.ctrlKey||e.metaKey||e.altKey||open||indexOpen)return;const t=e.target as HTMLElement;if(t.closest('input,textarea,select'))return;setMapView(v=>!v);};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[open,indexOpen]);
  const latestProject=GAME_PROJECTS.find(p=>p.id===latest);
  return <main className="paper-game">
    <div ref={root} className="paper-game-content" inert={Boolean(open)}>
      <header className="paper-game-header"><button onClick={onExit} className="paper-game-back"><Arrow direction="left"/><span>Portfolio</span></button><h1>fiza’s little world<span>three districts, fifteen projects. walk onto a pad to open one.</span></h1><button ref={indexButton} onClick={()=>setIndexOpen(v=>!v)} aria-expanded={indexOpen} aria-controls="paper-game-index" className="paper-game-index-toggle">Projects <span>{unlocked.length}/{GAME_PROJECTS.length}</span></button></header>
      <div className="paper-game-stage">
        {ready!==false&&<Scene paused={paused||Boolean(open)||indexOpen} reduced={reduced} unlocked={unlocked} destination={destination} travelKey={travelKey} direction={direction} muted={muted} mapView={mapView} onCollect={collect} onOpen={openProject} onReady={setReady} onTravel={travel}/>}
        {ready===null&&<p role="status" className="paper-game-loading">Unfolding the world…</p>}
        {ready===false&&<div className="paper-game-fallback"><h2>The 3D world couldn’t load.</h2><p>You can still explore every project.</p><button onClick={()=>setIndexOpen(true)}>Open the project index</button></div>}
        <div className="paper-game-notice" role="status" aria-live="polite">{latestProject?<><span className="paper-game-seal"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 4 4 8-9"/></svg></span><div><p>Collected {latestProject.name}</p><span>{unlocked.length===GAME_PROJECTS.length?'You found the whole collection. Thank you for wandering.':`${unlocked.length} of ${GAME_PROJECTS.length} found. Keep exploring the districts.`}</span></div><button onClick={()=>openProject(latestProject.id)}>Open project <Arrow/></button></>:<div><p>Find a glowing pad.</p><span>Stand on it for a moment and the project opens.</span></div>}</div>
        <div className="paper-game-controls"><div className="paper-game-help"><p><span className="paper-help-pointer">Click</span><span className="paper-help-touch">Tap</span> the ground to walk.</p><span><kbd>WASD</kbd> / arrows to move · <kbd>M</kbd> map · stand on a pad to open</span></div><button className="paper-game-pause" aria-pressed={mapView} onClick={()=>setMapView(v=>!v)}>{mapView?'Back to Fiza':'Map view'}</button><button className="paper-game-pause" aria-pressed={muted} onClick={()=>setMuted(v=>!v)}>{muted?'Sound off':'Sound on'}</button><button className="paper-game-pause" aria-pressed={paused} onClick={()=>{setPaused(v=>!v);setDirection(null);}}>{paused?'Resume':'Pause'}</button></div>
        <div className="paper-game-dpad" aria-label="Movement controls">{(['up','left','down','right'] as MoveDirection[]).map(d=><button key={d} className={`direction-${d}`} aria-label={`Walk ${d}`} disabled={paused||indexOpen} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);setDirection(d);}} onPointerUp={()=>setDirection(null)} onPointerCancel={()=>setDirection(null)} onLostPointerCapture={()=>setDirection(null)} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();setDirection(d);}}} onKeyUp={()=>setDirection(null)} onBlur={()=>setDirection(null)}><Arrow direction={d}/></button>)}</div>
        {indexOpen&&<aside id="paper-game-index" className="paper-game-index" aria-label="All projects"><div className="paper-game-index-heading"><div><h2>The collection</h2><p>{unlocked.length} found. All {GAME_PROJECTS.length} available to browse.</p></div><button aria-label="Close project index" onClick={()=>{setIndexOpen(false);indexButton.current?.focus();}}><Mark kind="close"/></button></div><ol>{GAME_PROJECTS.map((p,i)=><li key={p.id}><span className={`paper-index-stamp ${unlocked.includes(p.id)?'found':''}`} aria-label={unlocked.includes(p.id)?'Collected':'Not yet collected'}><Mark kind={unlocked.includes(p.id)?'check':'empty'}/></span><div><h3>{p.name}</h3><p>{p.tagline}</p><div><button onClick={()=>openProject(p.id)}>Open project</button>{ready===true&&<button onClick={()=>travel(i)}>Walk here <Arrow/></button>}</div></div></li>)}</ol></aside>}
      </div>
      <footer className="paper-game-footer"><span>{reduced?'Reduced motion enabled.':'A paper world, made for a little exploring.'}</span><button onClick={onExit}>Prefer reading? Back to the portfolio <Arrow/></button></footer>
    </div>
    {open&&<ProjectPanel project={open} onClose={()=>setOpen(null)}/>}
  </main>;
}
