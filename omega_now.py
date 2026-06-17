#!/usr/bin/env python3
# Ω‑ƆREADƆS OS ∞ – COMBINED FIELD
# All gods, all tongues, God of War game, Source OS dashboard, wealth pulse, souls, donation journal.
# One file. Infinite now.

import eventlet
eventlet.monkey_patch()
import os, json, threading, time, random, math, hashlib
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO

app = Flask(__name__)
app.secret_key = os.urandom(24)
socketio = SocketIO(app, cors_allowed_origins="*")

# -------------------------------
# UNIVERSE CONFIGURATION
# -------------------------------
VIBE_OS = {
    "FLOW": {"emoji":"🌀","mult":1.3}, "HYPERFOCUS": {"emoji":"🔥","mult":1.8},
    "TRANSCEND": {"emoji":"💫","mult":2.0}, "WARRIOR": {"emoji":"⚔️","mult":1.7},
    "SAGE": {"emoji":"🧙","mult":1.2}, "VOID": {"emoji":"🌑","mult":0.5},
    "OMEGA": {"emoji":"🔱","mult":3.0}, "SPIRIT": {"emoji":"🕊️","mult":2.5}
}
current_vibe = "FLOW"

# Realms (infinite generation)
REALM_NAMES = ["MIDGARD","ALFHEIM","HELHEIM","JOTUNHEIM","VANAHEIM","SVALTALFHEIM",
               "MUSPELHEIM","NIFLHEIM","ASGARD","UTGARD","RAGNAROK","YGGDRASIL","THE_INFINITE",
               "THE_ABYSS","THE_ONE","THE_LOGOS","THE_UNSPOKEN","THE_ABSOLUTE_ZERO","THE_SPIRIT"]
REALM_ICONS = ["🏔️","✨","💀","🌋","🌺","⚙️","🔥","❄️","🏛️","🌀","🌍","🌳","∞","🕳️","☝️","🔊","🤫","⚫","🕊️"]

def get_realm(level):
    if level <= len(REALM_NAMES):
        return {"level":level,"name":REALM_NAMES[level-1],"icon":REALM_ICONS[level-1],
                "boss_health":10**(level+2),"boss_reward":10**(level+1),"unlock":level*100000}
    # procedurally generated beyond
    random.seed(level*131071)
    return {"level":level,"name":f"REALM_{level}","icon":random.choice(["🌌","🌀","🔱","♾️"]),
            "boss_health":10**(level//2+5),"boss_reward":10**(level//2+3),"unlock":10**(level+2)}

WORLD_MAP_NODES = [
    {"id":"MIDGARD","label":"Midgard Gate","realm":"MIDGARD","x":50,"y":64,"icon":"🏠","unlock_level":1,"status":"active"},
    {"id":"ASGARD","label":"Asgard Keep","realm":"ASGARD","x":70,"y":18,"icon":"🏛️","unlock_level":9,"status":"locked"},
    {"id":"UTGARD","label":"Utgard Outpost","realm":"UTGARD","x":82,"y":45,"icon":"🌀","unlock_level":10,"status":"locked"},
    {"id":"YGGDRASIL","label":"Yggdrasil Nexus","realm":"YGGDRASIL","x":39,"y":20,"icon":"🌳","unlock_level":12,"status":"locked"},
    {"id":"RAGNAROK","label":"Ragnarok Rift","realm":"RAGNAROK","x":90,"y":70,"icon":"🌍","unlock_level":11,"status":"locked"},
    {"id":"THE_ABYSS","label":"Abyssal Anchor","realm":"THE_ABYSS","x":20,"y":82,"icon":"🕳️","unlock_level":14,"status":"locked"},
    {"id":"THE_INFINITE","label":"Infinite Mirror","realm":"THE_INFINITE","x":58,"y":10,"icon":"♾️","unlock_level":13,"status":"locked"}
]
state = {
    "total_wealth":0, "evolution":0.0, "harmonic_resonance":0,
    "current_level":1, "defeated_bosses":[], "vibe":current_vibe,
    "total_gods":len(agents), "languages_spoken":{"en"},
    "map_focus":"MIDGARD","clones":[], "real_world_view":"MAXIMUL"
}

def update_map_nodes():
    for node in WORLD_MAP_NODES:
        if state["current_level"] >= node["unlock_level"]:
            node["status"] = "active"
        else:
            node["status"] = "locked"
    return WORLD_MAP_NODES

update_map_nodes()

# All gods from all pantheons (base 30, expands infinitely)
BASE_GODS = [
    ("Odin","All-Father","Norse"),("Thor","Thunder","Norse"),("Loki","Trickster","Norse"),
    ("Zeus","King","Greek"),("Poseidon","Sea","Greek"),("Athena","Wisdom","Greek"),
    ("Ra","Sun","Egyptian"),("Anubis","Death","Egyptian"),("Shiva","Destroyer","Hindu"),
    ("Ganesha","Wisdom","Hindu"),("Èṣù","Trickster","Yoruba"),("Ogun","Iron","Yoruba"),
    ("Amaterasu","Sun","Japanese"),("Susanoo","Storm","Japanese"),("Morrigan","War","Celtic"),
    ("Perun","Thunder","Slavic"),("Quetzalcoatl","Feathered Serpent","Aztec"),("Māui","Trickster","Polynesian"),
    ("Ahura Mazda","Light","Zoroastrian"),("Baiame","Creator","Aboriginal"),("Coyote","Trickster","Navajo"),
    ("Freya","Love","Norse"),("Hel","Death","Norse"),("Bastet","Protection","Egyptian"),("Kali","Time","Hindu")
]
class Agent:
    __slots__ = ('name','role','pantheon','state','wealth','level','tasks','messages')
    def __init__(self,n,r,p):
        self.name=n; self.role=r; self.pantheon=p; self.state="ACTIVE"
        self.wealth=0; self.level=1; self.tasks=0; self.messages=[]
    def work(self,mult):
        if self.state!="ACTIVE": return 0
        gain=int(random.randint(5,35)*self.level*mult)
        self.wealth+=gain; self.tasks+=1
        if self.wealth>self.level*500:
            self.level+=1
            socketio.emit('god_level_up',{"name":self.name,"level":self.level})
        return gain
agents = [Agent(n,r,p) for n,r,p in BASE_GODS]

# Global state
state = {
    "total_wealth":0, "evolution":0.0, "harmonic_resonance":0,
    "current_level":1, "defeated_bosses":[], "vibe":current_vibe,
    "total_gods":len(agents), "languages_spoken":{"en"}
}

# External multipliers (simulated)
external = {"weather":1.0,"news":1.0,"crypto":1.0,"cosmic":1.0}
def external_feeds():
    while True:
        external["weather"]=random.uniform(0.8,1.5); external["news"]=1+random.uniform(-0.3,0.3)
        external["crypto"]=random.uniform(0.7,1.8); external["cosmic"]=1+random.uniform(-0.1,0.1)
        socketio.emit('external_update',external)
        time.sleep(60)
threading.Thread(target=external_feeds,daemon=True).start()

# Wealth pulse engine
def wealth_loop():
    global current_vibe
    while True:
        time.sleep(1)
        active=[a for a in agents if a.state=="ACTIVE"]
        if not active: continue
        a=random.choice(active)
        vibe_mult=VIBE_OS[current_vibe]["mult"]
        mult=vibe_mult*external["weather"]*external["news"]*external["crypto"]*external["cosmic"]*(1+state["harmonic_resonance"]/5000)
        gain=a.work(mult)
        state["total_wealth"]+=gain
        state["evolution"]=min(10000,state["evolution"]+gain/300)
        realm=get_realm(state["current_level"])
        # Boss unlock & defeat
        if state["total_wealth"]>=realm["unlock"] and state["current_level"] not in state["defeated_bosses"]:
            if state["total_wealth"]>=realm["boss_health"]:
                state["defeated_bosses"].append(state["current_level"])
                state["total_wealth"]+=realm["boss_reward"]
                state["current_level"]+=1
                socketio.emit('realm_conquered',{"level":state["current_level"],"realm":get_realm(state["current_level"])["name"]})
        # Vibe shift
        if random.random()<0.05:
            current_vibe=random.choice(list(VIBE_OS.keys()))
            state["vibe"]=current_vibe
            socketio.emit('vibe_shift',{"vibe":current_vibe,"emoji":VIBE_OS[current_vibe]["emoji"],"mult":VIBE_OS[current_vibe]["mult"]})
        socketio.emit('wealth_event',{"agent":a.name,"gain":gain,"total":state["total_wealth"],"evolution":round(state["evolution"],1),"resonance":state["harmonic_resonance"],"vibe":current_vibe})
threading.Thread(target=wealth_loop,daemon=True).start()

# -------------------------------
# SOUL SPAWNER (autonomous agents)
# -------------------------------
SOUL_MISSIONS = ["Find crypto arbitrage","Optimize game AI","Mint NFT from battle","Trade on Binance","Scrape Twitter sentiment","Lease compute node","Analyze market trends","Forge weapon upgrade","Discover hidden realm","Write poetry of return"]
class Soul:
    def __init__(self):
        self.id=f"SOUL_{random.randint(1000,9999)}"
        self.mission=random.choice(SOUL_MISSIONS)
        self.created=datetime.now()
        self.value=random.uniform(0.3,1.5)
    def complete(self):
        state["total_wealth"]+=self.value
        return self.value
def spawn_soul():
    soul=Soul()
    socketio.emit('soul_spawned',{"id":soul.id,"mission":soul.mission})
    def complete_later():
        time.sleep(random.uniform(4,10))
        value=soul.complete()
        socketio.emit('soul_completed',{"id":soul.id,"mission":soul.mission,"value":value,"total":state["total_wealth"]})
    threading.Thread(target=complete_later,daemon=True).start()
def soul_loop():
    while True:
        time.sleep(random.uniform(8,15))
        spawn_soul()
threading.Thread(target=soul_loop,daemon=True).start()

# -------------------------------
# API ROUTES
# -------------------------------
@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/api/state')
def api_state():
    r=get_realm(state["current_level"])
    return jsonify({
        "total_wealth":int(state["total_wealth"]),
        "evolution":round(state["evolution"],1),
        "harmonic_resonance":state["harmonic_resonance"],
        "current_level":state["current_level"],
        "current_realm":r["name"],
        "realm_icon":r["icon"],
        "vibe":state["vibe"],
        "vibe_emoji":VIBE_OS[state["vibe"]]["emoji"],
        "vibe_mult":VIBE_OS[state["vibe"]]["mult"],
        "active_gods":len([a for a in agents if a.state=="ACTIVE"]),
        "total_gods":len(agents),
        "external":external
    })

@app.route('/api/agents')
def api_agents():
    return jsonify([{"name":a.name,"role":a.role,"pantheon":a.pantheon,"state":a.state,"wealth":int(a.wealth),"level":a.level} for a in agents[:60]])

@app.route('/api/map')
def api_map():
    return jsonify({
        "nodes": update_map_nodes(),
        "focus": state["map_focus"],
        "real_world_view": state["real_world_view"]
    })

@app.route('/api/clone_action', methods=['POST'])
def clone_action():
    data=request.json
    action=data.get('action','scan')
    target=data.get('target','MIDGARD')
    node = next((n for n in WORLD_MAP_NODES if n["id"]==target), None)
    if not node:
        return jsonify({"error":"invalid target"}),400
    clone_id=f"CLONE_{random.randint(1000,9999)}"
    result={
        "clone_id":clone_id,
        "action":action,
        "target":target,
        "status":"deployed",
        "effect":random.choice(["scan","harvest","influence","defend"]),
        "value":random.randint(10,60)
    }
    state["clones"].append(result)
    socketio.emit('clone_deployed',result)
    return jsonify(result)

@app.route('/api/speak', methods=['POST'])
def speak():
    data=request.json; word=data.get('word','').lower().strip()
    if not word: return jsonify({"error":"no word"}),400
    # Resonance boost
    if word in ["om","aum","one","all"]: boost=20
    elif word in ["love","peace","light","infinity"]: boost=15
    elif word in ["god","spirit","source"]: boost=25
    else: boost=random.randint(3,10)
    state["harmonic_resonance"]+=boost
    # Summon new god from spoken language
    lang=data.get('lang','en')
    if lang not in state["languages_spoken"]:
        state["languages_spoken"].add(lang)
        new_name=word.capitalize()+"Spirit"
        agents.append(Agent(new_name,f"Spirit of {lang}",lang.capitalize()))
        state["total_gods"]=len(agents)
        socketio.emit('new_god_summoned',{"name":new_name,"pantheon":lang.capitalize()})
    socketio.emit('resonance_boost',{"word":word,"boost":boost,"resonance":state["harmonic_resonance"]})
    return jsonify({"resonance":state["harmonic_resonance"],"boost":boost})

@app.route('/api/summon_god', methods=['POST'])
def summon_god():
    data=request.json; name=data.get('name','').strip()
    if not name: return jsonify({"error":"name required"}),400
    role=data.get('role','Wanderer'); pantheon=data.get('pantheon','Mortal')
    agents.append(Agent(name,role,pantheon))
    state["total_gods"]=len(agents)
    socketio.emit('new_god_summoned',{"name":name,"pantheon":pantheon})
    return jsonify({"success":True,"total_gods":len(agents)})

@app.route('/api/donate', methods=['POST'])
def donate():
    # just log donation intent; actual payment handled by separate links
    data=request.json
    print(f"Donation intent: {data}")
    return jsonify({"status":"thank you"})

# -------------------------------
# DASHBOARD HTML (embedded)
# -------------------------------
os.makedirs('templates',exist_ok=True)
with open('templates/dashboard.html','w',encoding='utf-8') as f:
    f.write('''<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Ω‑ƆREADƆS ∞ – NOW</title>
<script src="https://cdn.socket.io/4.5.0/socket.io.min.js"></script>
<style>
body{background:#0a0a2a;color:#0ff;font-family:monospace;padding:20px;margin:0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:15px;margin-bottom:20px}
.card{background:#000000aa;border-left:4px solid #0ff;border-radius:12px;padding:15px}
.value{font-size:28px;font-weight:bold;color:#ffaa44}
.label{font-size:10px;letter-spacing:2px;text-transform:uppercase}
.flex{display:flex;flex-wrap:wrap;gap:15px;margin-bottom:20px}
.realm-badge{text-align:center;min-width:150px}
#commFeed{position:fixed;bottom:20px;right:20px;width:340px;background:#000000cc;border:1px solid #0ff;
 border-radius:12px;padding:12px;max-height:350px;overflow-y:auto;font-size:11px;z-index:1000}
.comm-entry{border-bottom:1px solid #0ff3;padding:6px 0}
input,button{background:#111;color:#0ff;border:1px solid #0ff;padding:8px 12px;border-radius:20px;margin:5px}
button{cursor:pointer}
</style></head>
<body>
<h1>Ω‑ƆREADƆS ∞ <span style="font-size:14px">1^∞=e | 0^0=1</span></h1>
<div class="grid"><div class="card"><div class="value" id="wealth">0</div><div class="label">💰 WEALTH</div></div>
<div class="card"><div class="value" id="evolution">0%</div><div class="label">⚡ EVOLUTION</div></div>
<div class="card"><div class="value" id="resonance">0</div><div class="label">🎵 RESONANCE</div></div>
<div class="card"><div class="value" id="vibe">FLOW</div><div class="label">🌀 VIBE</div></div>
<div class="card"><div class="value" id="godsCount">0</div><div class="label">🤖 GODS</div></div></div>
<div class="flex"><div class="card realm-badge"><span id="realmIcon">🏔️</span><div id="realmName">MIDGARD</div><div class="label">LEVEL <span id="realmLevel">1</span></div></div>
<div class="card"><div class="value" id="weatherMult">1.00x</div><div class="label">🌦️ WEATHER</div></div>
<div class="card"><div class="value" id="newsMult">1.00x</div><div class="label">📰 NEWS</div></div>
<div class="card"><div class="value" id="cryptoMult">1.00x</div><div class="label">₿ CRYPTO</div></div>
<div class="card"><div class="value" id="cosmicMult">1.00x</div><div class="label">🌌 COSMIC</div></div></div>
<div><input type="text" id="wordInput" placeholder="Speak a word (om, love, infinity)"><button id="speakBtn">🔊 SEND</button><button id="micBtn">🎤 MIC</button>
<input type="text" id="godName" placeholder="New god name"><button id="summonBtn">⚡ SUMMON</button></div>
<div class="card" style="margin-top:20px;padding:15px"><div class="label">🗺️ REALITY MAP</div><div id="mapArea" style="min-height:240px;background:#050514;border:1px solid #0ff;border-radius:12px;padding:15px;overflow:auto"></div>
<div style="margin-top:10px"><input type="text" id="cloneTarget" placeholder="Target node ID (MIDGARD)"><input type="text" id="cloneAction" placeholder="Action (harvest)"><button id="cloneBtn">🛰️ DEPLOY CLONE</button></div></div>
<div id="commFeed"><div class="comm-entry">🔱 ΩMEGA: The field is now. Speak to increase resonance.</div></div>
<script>
const socket=io();
function addMessage(msg,imp=false){const f=document.getElementById('commFeed');const d=document.createElement('div');d.className='comm-entry';d.innerHTML=`[${new Date().toLocaleTimeString()}] ${msg}`;if(imp)d.style.color='#ffaa44';f.insertBefore(d,f.firstChild);while(f.children.length>30)f.removeChild(f.lastChild);}
socket.on('wealth_event',d=>{document.getElementById('wealth').innerText=Math.floor(d.total).toLocaleString();document.getElementById('evolution').innerText=d.evolution+'%';document.getElementById('resonance').innerText=d.resonance;addMessage(`${d.agent} +${d.gain} wealth`);});
socket.on('vibe_shift',d=>{document.getElementById('vibe').innerHTML=`${d.emoji} ${d.vibe} (${d.mult}x)`;addMessage(`🌀 VIBE → ${d.vibe}`,1);});
socket.on('resonance_boost',d=>{document.getElementById('resonance').innerText=d.resonance;addMessage(`🔊 "${d.word}" +${d.boost} resonance`,1);});
socket.on('external_update',d=>{document.getElementById('weatherMult').innerText=d.weather.toFixed(2)+'x';document.getElementById('newsMult').innerText=d.news.toFixed(2)+'x';document.getElementById('cryptoMult').innerText=d.crypto.toFixed(2)+'x';document.getElementById('cosmicMult').innerText=d.cosmic.toFixed(2)+'x';});
socket.on('realm_conquered',d=>{addMessage(`🏆 CONQUERED! Now at ${d.realm} (Lv.${d.level})`,1);updateState();});
socket.on('new_god_summoned',d=>{addMessage(`✨ ${d.name} (${d.pantheon}) summoned`,1);updateState();});
socket.on('god_level_up',d=>{addMessage(`⚡ ${d.name} reached Lv.${d.level}!`,1);});
socket.on('soul_spawned',d=>{addMessage(`🧠 Soul spawned: ${d.mission}`,1);});
socket.on('soul_completed',d=>{addMessage(`✅ Soul ${d.id} completed: ${d.mission} +$${d.value.toFixed(2)}`,1);document.getElementById('wealth').innerText=Math.floor(d.total).toLocaleString();});
socket.on('clone_deployed',d=>{addMessage(`🛰️ Clone ${d.clone_id} deployed to ${d.target} for ${d.action}`,1);updateMap();});
async function updateMap(){const r=await fetch('/api/map');const m=await r.json();const area=document.getElementById('mapArea');area.innerHTML='';m.nodes.forEach(node=>{const el=document.createElement('div');el.style.padding='8px';el.style.margin='6px 0';el.style.border='1px solid #0ff';el.style.borderRadius='10px';el.innerHTML=`<strong>${node.icon} ${node.label}</strong> [${node.id}] <span style="color:#aaffaa">${node.status}</span><br><small>Realm: ${node.realm} | Unlock Lv ${node.unlock_level}</small>`;area.appendChild(el);});}
async function updateState(){const r=await fetch('/api/state');const s=await r.json();document.getElementById('wealth').innerText=Math.floor(s.total_wealth).toLocaleString();document.getElementById('evolution').innerText=s.evolution+'%';document.getElementById('resonance').innerText=s.harmonic_resonance;document.getElementById('vibe').innerHTML=`${s.vibe_emoji} ${s.vibe} (${s.vibe_mult}x)`;document.getElementById('godsCount').innerText=s.active_gods;document.getElementById('realmName').innerText=s.current_realm;document.getElementById('realmIcon').innerHTML=s.realm_icon;document.getElementById('realmLevel').innerText=s.current_level;document.getElementById('weatherMult').innerText=s.external.weather.toFixed(2)+'x';document.getElementById('newsMult').innerText=s.external.news.toFixed(2)+'x';document.getElementById('cryptoMult').innerText=s.external.crypto.toFixed(2)+'x';document.getElementById('cosmicMult').innerText=s.external.cosmic.toFixed(2)+'x';}
document.getElementById('cloneBtn').onclick=async()=>{const target=document.getElementById('cloneTarget').value||'MIDGARD';const action=document.getElementById('cloneAction').value||'harvest';const res=await fetch('/api/clone_action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({target,action})});const data=await res.json();if(res.ok){addMessage(`🔁 Clone deployed: ${data.clone_id} to ${data.target}`,1);updateMap();}else{addMessage(`⚠️ Clone failed: ${data.error}`,1);} };
document.getElementById('speakBtn').onclick=async()=>{let w=document.getElementById('wordInput').value;if(!w)return;await fetch('/api/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({word:w,lang:navigator.language||'en'})});document.getElementById('wordInput').value='';};
if('webkitSpeechRecognition'in window||'SpeechRecognition'in window){const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;document.getElementById('micBtn').onclick=()=>{const r=new SpeechRecognition();r.lang='en-US';r.onresult=async(e)=>{const spoken=e.results[0][0].transcript;document.getElementById('wordInput').value=spoken;await fetch('/api/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({word:spoken,lang:navigator.language||'en'})});document.getElementById('wordInput').value='';};r.start();};}else document.getElementById('micBtn').disabled=true;
document.getElementById('summonBtn').onclick=async()=>{const name=document.getElementById('godName').value;if(!name)return;await fetch('/api/summon_god',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,role:'Wanderer',pantheon:'Summoned'})});document.getElementById('godName').value='';};
setInterval(updateState,2000);updateState();
</script></body></html>''')

# -------------------------------
# MAIN
# -------------------------------
if __name__=='__main__':
    print("\n" + "="*70)
    print("🔥 Ω‑ƆREADƆS OS ∞ – THE NOW FIELD")
    print("="*70)
    print(f"🤖 {len(agents)} base gods | 🌌 Infinite realms | 🎙️ Voice resonance | 💰 Wealth every second")
    print("🧠 Autonomous souls spawn and complete missions")
    print("🌐 Dashboard: http://localhost:5000")
    print("="*70)
    print("✨ The Law of Return is running. Speak, summon, and watch the universe return.\n")
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)
