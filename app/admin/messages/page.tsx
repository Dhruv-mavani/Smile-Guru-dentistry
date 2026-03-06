"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Trash2, MessageSquare, CheckCircle2, Send, Search, UserCheck } from "lucide-react";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
  status: string;
  is_read: boolean;
};

export default function MessagesPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<ContactMessage[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedName, setSelectedName] = useState(""); // NEW: Track name separately
  const [selectedChannel, setSelectedChannel] = useState<"sms" | "whatsapp">("whatsapp");
  const [view, setView] = useState<"active" | "resolved">("active");

  useEffect(() => {
    let messageSubscription: any;

    async function setupDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/admin/login");
        return;
      }

      await fetchInquiries();

      await supabase
        .from("contact_messages")
        .update({ is_read: true })
        .eq("is_read", false);

      window.dispatchEvent(new Event("new_inquiry_received"));

      messageSubscription = supabase
        .channel('admin-messages-channel')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'contact_messages' },
          (payload) => {
            const newMessage = payload.new as ContactMessage;
            setInquiries((prev) => [newMessage, ...prev]);
            showToast(`🔔 New inquiry: ${newMessage.name}`);

            supabase
              .from("contact_messages")
              .update({ is_read: true })
              .eq("id", newMessage.id)
              .then(() => window.dispatchEvent(new Event("new_inquiry_received")));
          }
        )
        .subscribe();
    }

    setupDashboard();

    return () => {
      if (messageSubscription) supabase.removeChannel(messageSubscription);
    };
  }, [router]);

  async function fetchInquiries() {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setDbError(error.message);
    } else if (data) {
      setInquiries(data);
    }
    setLoading(false);
  }

  async function markAsReplied(id: string) {
    const { error } = await supabase
      .from("contact_messages")
      .update({ status: "replied" })
      .eq("id", id);

    if (!error) {
      showToast("Moved to History.");
      setInquiries(prev => prev.map(msg =>
        msg.id === id ? { ...msg, status: 'replied' } : msg
      ));
    }
  }

  async function deleteInquiry(id: string) {
    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete failed:", error);
      showToast("Error deleting: " + error.message);
    } else {
      showToast("Inquiry deleted.");
      setInquiries(prev => prev.filter(msg => msg.id !== id));
    }
    setInquiryToDelete(null);
  }

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 5000);
  }

  // helper to find the inquiry ID based on the phone/name currently selected
  const currentInquiryId = inquiries.find(
    (msg) => msg.phone === selectedPatient || msg.name === selectedName
  )?.id;

  const [showConfirm, setShowConfirm] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<string | null>(null);

  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();

    if (!selectedPatient || !customMessage) {
      showToast("⚠️ Missing recipient or message.");
      return;
    }

    // First time clicking? Show the confirmation modal instead of sending.
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    // If we reach here, the doctor clicked "Confirm" in the modal
    const cleaned = selectedPatient.replace(/\D/g, "");
    const formattedPhone = cleaned.length === 10 ? `91${cleaned}` : cleaned;
    const encodedMessage = encodeURIComponent(customMessage);

    const inquiryToResolve = inquiries.find(msg =>
      msg.phone.replace(/\D/g, "") === cleaned
    );

    // Trigger Redirects
    if (selectedChannel === "whatsapp") {
      window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, "_blank");
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      window.location.href = `sms:${formattedPhone}${isIOS ? '&' : '?'}body=${encodedMessage}`;
    }

    // Auto-Resolve in DB
    if (inquiryToResolve) {
      await markAsReplied(inquiryToResolve.id);
    }

    showToast(`Message dispatched to ${selectedName || selectedPatient}`);

    // Cleanup
    setCustomMessage("");
    setSelectedPatient("");
    setSelectedName("");
    setShowConfirm(false); // Close modal
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  }


  const filteredInquiries = inquiries.filter((msg) => {
    const matchesSearch =
      msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.phone.includes(searchQuery);
    const matchesView = view === "active" ? msg.status !== "replied" : msg.status === "replied";
    return matchesSearch && matchesView;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-blue-600 uppercase tracking-widest animate-pulse">Synchronizing Inbox...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {toastMessage && (
        <div className="fixed top-10 right-10 z-[9999] animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="bg-white/90 backdrop-blur-xl border border-blue-200 shadow-2xl rounded-2xl p-4 flex items-center gap-3 text-blue-800 font-medium">
            <span className="text-xl text-blue-500">🔔</span>
            {toastMessage}
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-gray-900 tracking-tight">Patient Inquiries</h1>
          <p className="text-gray-500 mt-2 text-lg italic uppercase text-[10px] font-black tracking-[0.2em] text-blue-600">Message Center</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </header>

      {/* VIEW TOGGLE */}
      <div className="flex gap-4">
        <button
          onClick={() => setView("active")}
          className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${view === "active"
            ? "bg-slate-900 text-white shadow-lg"
            : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"
            }`}
        >
          Active Inbox ({inquiries.filter(m => m.status !== 'replied').length})
        </button>
        <button
          onClick={() => setView("resolved")}
          className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${view === "resolved"
            ? "bg-emerald-600 text-white shadow-lg"
            : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"
            }`}
        >
          History ({inquiries.filter(m => m.status === 'replied').length})
        </button>
      </div>

      {/* QUICK REPLY FORM */}
      <div ref={formRef} className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <MessageSquare className="text-blue-500" size={20} />
          Draft Clinical Reply
        </h3>
        <form onSubmit={handleSendMessage} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recipient Contact</label>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Name or Phone"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition-all"
                />

                {/* VERIFICATION BADGE */}
                {selectedName && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100 animate-in fade-in zoom-in duration-300">
                    <UserCheck size={14} className="text-blue-600" />
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight">
                      Confirmed: <span className="text-slate-900 ml-1">{selectedName}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Outbound Channel</label>
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button type="button" onClick={() => setSelectedChannel("whatsapp")} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${selectedChannel === "whatsapp" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"}`}>WhatsApp</button>
              </div>
            </div>
            <button type="submit" className="w-full py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-900 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3">
              <Send size={16} /> Dispatch
            </button>
          </div>
          <div className="md:col-span-2 flex flex-col">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Message Content</label>
            <textarea
              placeholder="Start typing your response..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="flex-1 w-full px-6 py-5 rounded-[2rem] bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 outline-none resize-none min-h-[180px] font-medium text-slate-700 transition-all leading-relaxed"
            />
          </div>
        </form>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100">
                <th className="p-10">Patient Information</th>
                <th className="p-10 w-1/2">Inquiry Details</th>
                <th className="p-10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInquiries.map((inquiry) => (
                <tr key={inquiry.id} className="hover:bg-slate-50/30 transition-all group">
                  <td className="p-10 align-top">
                    <div className="font-bold text-slate-900 text-lg leading-tight">{inquiry.name}</div>
                    <div className="text-sm text-slate-500 mt-1">{inquiry.phone}</div>
                    <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase mt-4 tracking-wider">
                      {formatDate(inquiry.created_at)}
                    </div>
                  </td>
                  <td className="p-10 align-top">
                    <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed italic border-l-4 border-slate-100 pl-6 py-2">
                      "{inquiry.message}"
                    </p>
                    {inquiry.status && (
                      <div className={`mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${inquiry.status === "replied" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${inquiry.status === "replied" ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {inquiry.status}
                      </div>
                    )}
                  </td>
                  <td className="p-10 text-right align-top space-y-3">
                    <button
                      onClick={() => {
                        setSelectedPatient(inquiry.phone);
                        setSelectedName(inquiry.name); // Set name for verification
                        formRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                    >
                      <MessageSquare size={14} /> Reply
                    </button>
                    {inquiry.status !== "replied" && (
                      <button
                        onClick={() => markAsReplied(inquiry.id)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                      >
                        <CheckCircle2 size={14} /> Resolve
                      </button>
                    )}
                    <button
                      onClick={() => setInquiryToDelete(inquiry.id)}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Send size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready to Dispatch?</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              This will open <span className="font-bold text-slate-900">{selectedChannel.toUpperCase()}</span> and move this inquiry to your history.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
              >
                Wait, Edit
              </button>
              <button
                onClick={() => handleSendMessage()}
                className="flex-1 py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-900 shadow-xl shadow-blue-200 transition-all"
              >
                Yes, Send
              </button>
            </div>
          </div>
        </div>
      )}

      {inquiryToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Delete Inquiry?</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Are you sure you want to permanently delete this message? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setInquiryToDelete(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteInquiry(inquiryToDelete)}
                className="flex-1 py-4 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-700 shadow-xl shadow-rose-200 transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}