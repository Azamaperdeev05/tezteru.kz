import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, doc, onSnapshot, updateDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { generateWords } from '../lib/words';
import { Users, Copy, Check, Trophy, Loader2 } from 'lucide-react';

export function MultiplayerRace() {
  const [roomId, setRoomId] = useState('');
  const [roomData, setRoomData] = useState<any>(null);
  const [joinId, setJoinId] = useState('');
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, 'rooms', roomId), (docSnap) => {
      if (docSnap.exists()) {
        setRoomData(docSnap.data());
      }
    });
    return () => unsub();
  }, [roomId]);

  const generateRoomCode = async () => {
    let code = '';
    let exists = true;
    while (exists) {
      code = Math.floor(1000 + Math.random() * 9000).toString();
      const docSnap = await getDoc(doc(db, 'rooms', code));
      exists = docSnap.exists();
    }
    return code;
  };

  const createRoom = async () => {
    if (!auth.currentUser) return alert('Алдымен жүйеге кіріңіз!');
    setIsCreating(true);
    const targetText = generateWords(20, false, false);
    try {
      const code = await generateRoomCode();
      await setDoc(doc(db, 'rooms', code), {
        status: 'waiting',
        targetText,
        createdAt: serverTimestamp(),
        players: {
          [auth.currentUser.uid]: {
            displayName: auth.currentUser.displayName || 'Ойыншы 1',
            progress: 0,
            finished: false,
            wpm: 0
          }
        }
      });
      setRoomId(code);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!auth.currentUser) return alert('Алдымен жүйеге кіріңіз!');
    if (!joinId) return;
    setIsJoining(true);
    try {
      const roomRef = doc(db, 'rooms', joinId);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) {
        alert('Бөлме табылмады!');
        setIsJoining(false);
        return;
      }
      await setDoc(roomRef, {
        players: {
          [auth.currentUser.uid]: {
            displayName: auth.currentUser.displayName || 'Ойыншы 2',
            progress: 0,
            finished: false,
            wpm: 0
          }
        }
      }, { merge: true });
      setRoomId(joinId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsJoining(false);
    }
  };

  const startGame = async () => {
    if (!roomId) return;
    await updateDoc(doc(db, 'rooms', roomId), { 
      status: 'playing',
      startedAt: Date.now()
    });
  };

  const handleInput = async (val: string) => {
    if (!roomData || roomData.status !== 'playing' || !auth.currentUser) return;
    
    const targetText = roomData.targetText;
    let correct = '';
    for(let i=0; i<val.length; i++) {
      if (val[i] === targetText[i]) correct += val[i];
      else break;
    }
    
    setInput(correct);

    const progress = Math.round((correct.length / targetText.length) * 100);
    const finished = correct.length === targetText.length;
    
    let wpm = 0;
    if (finished && roomData.startedAt) {
      const timeElapsedMs = Date.now() - roomData.startedAt;
      const timeInMinutes = timeElapsedMs / 60000;
      wpm = Math.round((targetText.length / 5) / timeInMinutes);
    }

    const updates: any = {
      [`players.${auth.currentUser.uid}.progress`]: progress,
      [`players.${auth.currentUser.uid}.finished`]: finished
    };
    
    if (finished) {
      updates[`players.${auth.currentUser.uid}.wpm`] = wpm;
    }

    await updateDoc(doc(db, 'rooms', roomId), updates);

    if (finished) {
      // Check if everyone is finished
      const allFinished = Object.entries(roomData.players).every(([uid, p]: [string, any]) => 
        uid === auth.currentUser?.uid ? true : p.finished
      );
      if (allFinished) {
        await updateDoc(doc(db, 'rooms', roomId), { status: 'finished' });
      }
    }
  };

  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-12 animate-in fade-in duration-500">
        <div className="text-center px-4">
          <Users size={32} className="mx-auto mb-4 text-(--accent-color) sm:w-12 sm:h-12" />
          <h2 className="text-2xl sm:text-3xl font-bold text-(--main-color) mb-2">Жарыс режимі</h2>
          <p className="text-(--sub-color) text-sm sm:text-base">Достарыңызбен нақты уақытта жарысыңыз</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl">
          <div className="flex-1 bg-(--bg-color) p-6 sm:p-8 rounded-2xl border border-(--sub-color)/20 flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-(--main-color) mb-4">Жаңа бөлме құру</h3>
            <button 
              onClick={createRoom} 
              disabled={isCreating}
              className="px-6 py-3 bg-(--accent-color) text-(--bg-color) rounded-full font-bold hover:opacity-90 transition-opacity w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCreating ? <Loader2 size={20} className="animate-spin" /> : 'Бөлме ашу'}
            </button>
          </div>
          
          <div className="flex-1 bg-(--bg-color) p-6 sm:p-8 rounded-2xl border border-(--sub-color)/20 flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-(--main-color) mb-4">Бөлмеге қосылу</h3>
            <input 
              type="text" 
              placeholder="4 таңбалы код..." 
              maxLength={4}
              value={joinId}
              onChange={e => setJoinId(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-2 mb-4 bg-transparent border border-(--sub-color) rounded-lg text-(--main-color) focus:border-(--accent-color) outline-none text-center font-mono text-xl tracking-widest"
            />
            <button 
              onClick={joinRoom} 
              disabled={isJoining || joinId.length !== 4}
              className="px-6 py-3 bg-(--main-color) text-(--bg-color) rounded-full font-bold hover:opacity-90 transition-opacity w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isJoining ? <Loader2 size={20} className="animate-spin" /> : 'Қосылу'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!roomData) return <div className="text-center text-[var(--sub-color)]">Күте тұрыңыз...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-(--bg-color) p-4 rounded-xl border border-(--sub-color)/20 gap-4 sm:gap-0">
        <div>
          <p className="text-xs sm:text-sm text-(--sub-color)">Бөлме коды:</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg sm:text-xl text-(--main-color)">{roomId}</span>
            <button 
              onClick={() => { navigator.clipboard.writeText(roomId); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-(--sub-color) hover:text-(--accent-color)"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>
        {roomData.status === 'waiting' && (
          <button onClick={startGame} className="w-full sm:w-auto px-6 py-2 bg-(--accent-color) text-(--bg-color) rounded-full font-bold hover:opacity-90">
            Жарысты бастау
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {Object.entries(roomData.players || {}).map(([uid, player]: [string, any]) => (
          <div key={uid} className="relative w-full h-12 sm:h-14 bg-(--bg-color) rounded-full border border-(--sub-color)/20 overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-(--accent-color)/20 transition-all duration-300"
              style={{ width: `${player.progress}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-3 sm:px-6 z-10">
              <span className="font-bold text-xs sm:text-base text-(--main-color) drop-shadow-md truncate max-w-[120px] sm:max-w-none">{player.displayName}</span>
              <div className="flex items-center gap-2 sm:gap-3">
                {player.wpm > 0 && <span className="font-mono font-bold text-(--accent-color) text-xs sm:text-base">{player.wpm} <span className="hidden xs:inline">ЖСМ</span></span>}
                <span className="font-mono text-(--sub-color) text-xs sm:text-base">{player.progress}%</span>
                {player.finished && <Trophy size={14} className="text-yellow-500 sm:w-5 sm:h-5" />}
              </div>
            </div>
            <div 
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 text-lg sm:text-2xl z-0 opacity-50 scale-x-[-1]"
              style={{ left: `calc(${player.progress}% - 20px)` }}
            >
              🏎️
            </div>
          </div>
        ))}
      </div>

      {roomData.status === 'playing' && (
        <div className="mt-4 sm:mt-8 px-4">
          <div className="text-lg sm:text-2xl leading-relaxed mb-6 sm:mb-8 text-(--sub-color) select-none typing-font">
            {roomData.targetText.split('').map((char: string, i: number) => (
              <span key={i} className={i < input.length ? 'text-(--main-color)' : ''}>{char}</span>
            ))}
          </div>
          <input
            type="text"
            value={input}
            onChange={e => handleInput(e.target.value)}
            className="w-full px-4 py-3 sm:px-6 sm:py-4 text-lg sm:text-2xl typing-font bg-(--bg-color) border-2 border-(--sub-color) rounded-xl text-(--main-color) focus:border-(--accent-color) outline-none"
            placeholder="Осында жазыңыз..."
            autoFocus
          />
        </div>
      )}

      {roomData.status === 'finished' && (
        <div className="mt-8 p-8 bg-[var(--bg-color)] rounded-2xl border border-[var(--sub-color)]/20 text-center animate-in zoom-in duration-500">
          <h2 className="text-3xl font-bold text-[var(--accent-color)] mb-6">Жарыс аяқталды!</h2>
          <div className="flex flex-col gap-4 max-w-md mx-auto">
            {Object.entries(roomData.players || {})
              .sort(([, a]: any, [, b]: any) => b.wpm - a.wpm)
              .map(([uid, player]: [string, any], index) => (
                <div key={uid} className="flex justify-between items-center p-4 rounded-xl bg-[var(--sub-color)]/5 border border-[var(--sub-color)]/10">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-[var(--sub-color)]">#{index + 1}</span>
                    <span className="font-bold text-[var(--main-color)]">{player.displayName}</span>
                  </div>
                  <div className="font-mono font-bold text-[var(--accent-color)] text-xl">
                    {player.wpm} ЖСМ
                  </div>
                </div>
              ))}
          </div>
          <button 
            onClick={() => {
              setRoomId('');
              setRoomData(null);
              setJoinId('');
              setInput('');
            }} 
            className="mt-8 px-8 py-3 bg-[var(--main-color)] text-[var(--bg-color)] rounded-full font-bold hover:opacity-90 transition-opacity"
          >
            Жаңа жарыс бастау
          </button>
        </div>
      )}
    </div>
  );
}
