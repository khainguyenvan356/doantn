import { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, ShoppingCart, Sparkles, X } from 'lucide-react';
import { formatPrice, products } from './data.js';

const newGreeting = () => ({
  id: Date.now(),
  role: 'assistant',
  text: 'Chào bạn! Mình có thể giúp chọn dầu nhớt theo loại xe và cấp nhớt. Xe bạn đang sử dụng là xe gì?',
  quickReplies: ['Xe tay ga', 'Xe số', 'Ô tô'],
});

function identifyVehicle(value) {
  const text = value.toLowerCase();
  if (text.includes('ga') || text.includes('scooter')) return 'Xe ga';
  if (text.includes('số') || text.includes('so')) return 'Xe số';
  if (text.includes('ô tô') || text.includes('oto') || text.includes('ôto') || text.includes('car')) return 'Ô tô';
  return '';
}

export default function ChatAssistant({ onAdd, onDetail }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([newGreeting()]);
  const [input, setInput] = useState('');
  const [stage, setStage] = useState('vehicle');
  const [vehicle, setVehicle] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, open]);

  const sendMessage = (raw) => {
    const value = raw.trim();
    if (!value) return;
    const userMessage = { id: Date.now(), role: 'user', text: value };

    if (stage === 'vehicle' || stage === 'done') {
      const foundVehicle = identifyVehicle(value);
      if (!foundVehicle) {
        setMessages(current => [...current, userMessage, {
          id: Date.now() + 1,
          role: 'assistant',
          text: 'Bạn cho mình biết xe tay ga, xe số hay ô tô nhé. Nếu chưa chắc, hãy chọn một gợi ý bên dưới.',
          quickReplies: ['Xe tay ga', 'Xe số', 'Ô tô'],
        }]);
      } else {
        setVehicle(foundVehicle);
        setStage('grade');
        setMessages(current => [...current, userMessage, {
          id: Date.now() + 1,
          role: 'assistant',
          text: `Mình đã ghi nhận ${foundVehicle}. Bạn đang tìm cấp nhớt nào? Nếu chưa rõ, mình sẽ gợi ý theo danh mục hiện có.`,
          quickReplies: ['10W40', '5W30', 'Chưa biết'],
        }]);
      }
    } else {
      const foundGrade = value.match(/\b(10w-?40|5w-?30)\b/i)?.[0]?.replace('-', '').toUpperCase() || '';
      const selectedGrade = foundGrade || (value.toLowerCase().includes('chưa') || value.toLowerCase().includes('không') ? '' : '');
      const suitableOils = products.filter(product => (product.kind || 'Dầu nhớt') === 'Dầu nhớt' && (product.vehicleTypes ? product.vehicleTypes.includes(vehicle) : product.type === vehicle));
      const matches = suitableOils.filter(product => !selectedGrade || product.grade.toLowerCase() === selectedGrade.toLowerCase());
      const suggestions = matches.length ? matches : suitableOils.slice(0, 2);
      const gradeText = selectedGrade ? ` cấp ${selectedGrade}` : '';
      setStage('done');
      setMessages(current => [...current, userMessage, {
        id: Date.now() + 1,
        role: 'assistant',
        text: suggestions.length
          ? `Dựa trên lựa chọn ${vehicle}${gradeText}, bạn có thể tham khảo sản phẩm dưới đây. Hãy đối chiếu thêm với sách hướng dẫn sử dụng xe để chọn đúng tiêu chuẩn.`
          : `Mình chưa tìm thấy sản phẩm phù hợp cho ${vehicle}${gradeText} trong danh mục mẫu. Bạn có thể thử lại với cấp nhớt khác.`,
        products: suggestions,
        quickReplies: ['Tư vấn xe khác'],
      }]);
    }
    setInput('');
  };

  const resetChat = () => {
    setMessages([newGreeting()]);
    setStage('vehicle');
    setVehicle('');
  };

  return <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end sm:bottom-6 sm:right-6">
    {open && <section className="mb-3 flex h-[min(620px,calc(100dvh-110px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/20" aria-label="Trợ lý tư vấn dầu nhớt">
      <div className="flex items-center gap-3 bg-gray-950 px-4 py-4 text-white">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-600"><Bot size={21}/></span>
        <div className="min-w-0 flex-1"><b className="block text-sm">Trợ lý Lube Center</b><span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> Tư vấn chọn dầu nhớt</span></div>
        <button onClick={resetChat} className="rounded-lg p-2 text-gray-300 hover:bg-white/10 hover:text-white" aria-label="Bắt đầu tư vấn mới" title="Bắt đầu tư vấn mới"><Sparkles size={16}/></button>
        <button onClick={()=>setOpen(false)} className="rounded-lg p-2 text-gray-300 hover:bg-white/10 hover:text-white" aria-label="Đóng trợ lý"><X size={18}/></button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
        {messages.map(message=><div key={message.id} className={`flex ${message.role==='user'?'justify-end':'justify-start'}`}>
          <div className={`max-w-[88%] ${message.role==='user'?'rounded-2xl rounded-br-md bg-red-600 px-3.5 py-2.5 text-white':'rounded-2xl rounded-bl-md border border-gray-100 bg-white px-3.5 py-2.5 text-gray-700 shadow-sm'}`}>
            <p className="text-xs leading-5">{message.text}</p>
            {message.products?.length>0 && <div className="mt-3 space-y-2">{message.products.map(product=><div key={product.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">{product.brand} · {product.grade}</p>
              <button onClick={()=>onDetail(product)} className="mt-1 block text-left text-xs font-bold text-gray-900 hover:text-red-600">{product.name}</button>
              <div className="mt-2 flex items-center justify-between gap-2"><b className="text-xs text-gray-900">{formatPrice(product.price)}</b><button onClick={()=>onAdd(product)} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-red-700"><ShoppingCart size={12}/> Thêm giỏ</button></div>
            </div>)}</div>}
            {message.quickReplies?.length>0 && <div className="mt-3 flex flex-wrap gap-1.5">{message.quickReplies.map(reply=><button key={reply} onClick={()=>sendMessage(reply)} className="rounded-full border border-red-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-red-600 hover:bg-red-50">{reply}</button>)}</div>}
          </div>
        </div>)}
        <div ref={messagesEndRef}/>
      </div>
      <form onSubmit={event=>{event.preventDefault();sendMessage(input);}} className="flex items-center gap-2 border-t border-gray-100 bg-white p-3">
        <input value={input} onChange={event=>setInput(event.target.value)} placeholder={stage==='vehicle'?'Nhập loại xe của bạn...':'Nhập cấp nhớt (10W40, 5W30)...'} className="min-w-0 flex-1 rounded-xl bg-gray-100 px-3.5 py-3 text-xs outline-none focus:ring-2 focus:ring-red-100" aria-label="Tin nhắn cho trợ lý"/>
        <button disabled={!input.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300" aria-label="Gửi tin nhắn"><Send size={16}/></button>
      </form>
      <div className="border-t border-gray-100 px-3 py-2 text-center text-[9px] leading-4 text-gray-400">Gợi ý dựa trên dữ liệu sản phẩm mẫu. Vui lòng kiểm tra sách hướng dẫn xe.</div>
    </section>}
    <button onClick={()=>setOpen(value=>!value)} className="relative grid h-16 w-16 place-items-center rounded-full bg-red-600 p-0 text-white shadow-lg shadow-red-300/60 transition hover:scale-105 hover:bg-red-700" aria-label={open?'Đóng trợ lý tư vấn':'Mở trợ lý tư vấn dầu nhớt'} title="Tư vấn dầu nhớt">
      {open ? <X size={26}/> : <MessageCircle size={27}/>} {!open&&<span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-red-600 bg-emerald-300"/>}
    </button>
  </div>;
}
