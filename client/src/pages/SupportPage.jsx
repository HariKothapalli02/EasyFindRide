import React from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { Phone, MessageCircle, Mail, ChevronRight, HelpCircle, FileText } from 'lucide-react';

const SupportPage = () => {
    return (
        <div className="pb-32 min-h-screen bg-grayBg">
            <Navbar />
            
            <div className="p-6">
                <div className="font-heading text-4xl mb-2">Help & <span className="text-orange">Support</span></div>
                <p className="text-[#888] font-bold text-sm mb-8">We're here to help you 24/7</p>

                {/* CONTACT OPTIONS */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {[
                        { icon: Phone, title: 'Call Support', desc: 'Instant Call', color: 'bg-orange text-white' },
                        { icon: MessageCircle, title: 'Chat Support', desc: 'Live Chat', color: 'bg-black text-white' },
                    ].map((item, i) => (
                        <button key={i} className={`p-5 rounded-3xl flex flex-col gap-3 text-left shadow-lg active:scale-95 transition-all ${item.color}`}>
                            <item.icon size={24} />
                            <div>
                                <div className="font-heading text-xl">{item.title}</div>
                                <div className="text-[11px] font-bold opacity-70">{item.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* FAQ SECTION */}
                <div className="space-y-4">
                    <div className="text-[10px] font-black text-[#888] uppercase tracking-[2px] ml-2">Common Topics</div>
                    {[
                        { icon: HelpCircle, title: 'How to book a ride?' },
                        { icon: FileText, title: 'Payment Issues' },
                        { icon: MessageCircle, title: 'Report a Safety Concern' },
                        { icon: Mail, title: 'Submit a Suggestion' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-black/5 active:scale-95 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center text-orange">
                                    <item.icon size={20} />
                                </div>
                                <span className="font-black text-sm">{item.title}</span>
                            </div>
                            <ChevronRight size={18} className="text-[#bbb]" />
                        </div>
                    ))}
                </div>

                {/* EMAIL CARD */}
                <div className="mt-8 bg-orange-pale p-6 rounded-[32px] border border-orange/10 text-center">
                    <Mail size={32} className="text-orange mx-auto mb-3" />
                    <h3 className="font-black text-black mb-1">Email Us</h3>
                    <p className="text-[#888] text-sm font-bold mb-4">support@easyfindride.com</p>
                    <button className="w-full bg-white text-orange font-bold py-3 rounded-2xl border border-orange/10 active:scale-95 transition-all">Send Email</button>
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default SupportPage;
