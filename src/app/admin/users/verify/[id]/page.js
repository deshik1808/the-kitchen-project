"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import * as icons from "lucide-react";

/**
 * Mock function to simulate fetching verification details.
 */
async function getVerificationSummary(id) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  return {
    id,
    user: {
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      phone: "+91 9876543210",
      dob: "1990-05-15",
      avatar: "https://i.pravatar.cc/150?u=john",
    },
    status: "pending",
    created_at: new Date().toISOString(),
    metadata: {
      aadhar_number: "XXXX-XXXX-1234",
      pan_number: "ABCDE1234F",
    },
    verification_results: {
      "Identity (Aadhar)": "verified",
      "PAN Card": "verified",
      "Email Address": "verified",
      "Phone Number": "pending",
      "Criminal Record": "clean",
      "Address Proof": "flagged",
    },
  };
}

const { 
  MoreVertical, 
  BadgeInfo, 
  CheckCircle2, 
  CircleOff, 
  Trash2, 
  Printer, 
  CheckCheck, 
  RefreshCw,
  ChevronLeft,
  XCircle,
  AlertCircle,
  Phone,
  Calendar,
  User2
} = icons;

const StatusChip = ({ status }) => {
  const normalized = status?.toLowerCase();
  let colors = "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400";
  let icon = null;

  if (normalized === "verified" || normalized === "clean") {
    colors = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    icon = <CheckCircle2 size={12} className="mr-1" />;
  } else if (normalized === "pending") {
    colors = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    icon = <RefreshCw size={12} className="mr-1 animate-spin" />;
  } else if (normalized === "flagged") {
    colors = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    icon = <AlertCircle size={12} className="mr-1" />;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors}`}>
      {icon}
      {status}
    </span>
  );
};

const DetailRow = ({ title, content }) => (
  <div className="flex border-b py-3 px-1 border-gray-100 dark:border-zinc-800 last:border-0 items-center">
    <p className="font-semibold text-[10px] min-w-[140px] uppercase text-zinc-400 tracking-wider">
      {title}
    </p>
    <div className="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
      {content || "N/A"}
    </div>
  </div>
);

export default function CheckDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getVerificationSummary(id);
      setSummary(data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleAction = async (action) => {
    console.log(`Action: ${action} for ID: ${id}`);
    alert(`${action} successful (Mock)`);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="text-zinc-400 font-medium animate-pulse text-sm">Fetching Verification Data...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Verification Not Found</h2>
        <p className="text-zinc-500 mt-2">The record you are looking for might have been deleted or moved.</p>
        <button 
          onClick={() => router.back()}
          className="mt-6 px-6 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { user, verification_results, metadata } = summary;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 font-body">
      {/* Header / Breadcrumbs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
             <span className="hover:text-zinc-600 cursor-pointer" onClick={() => router.push('/admin')}>Dashboard</span>
             <span>/</span>
             <span className="hover:text-zinc-600 cursor-pointer">Verifications</span>
             <span>/</span>
             <span className="text-zinc-900 dark:text-zinc-100 font-medium">Details</span>
          </nav>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => router.back()}
               className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
             >
                <ChevronLeft size={20} />
             </button>
             <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">Verification Profile</h1>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => handleAction('Reject')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-100 dark:border-red-900/30"
          >
            <XCircle size={18} />
            Reject
          </button>
          <button 
            onClick={() => handleAction('Approve')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
          >
            <CheckCheck size={18} />
            Approve
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - User Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 text-center shadow-sm border border-zinc-100 dark:border-zinc-800">
            <div className="relative inline-block mb-6">
              <div className="w-28 h-28 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden border-4 border-orange-500/10 p-1">
                {user?.avatar ? (
                  <img src={user.avatar} alt="User" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-zinc-100 flex items-center justify-center text-zinc-300">
                    <User2 size={40} />
                  </div>
                )}
              </div>
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-amber-500 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center shadow-sm">
                <RefreshCw size={12} className="text-white animate-spin-slow" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold dark:text-white capitalize leading-tight">
              {user?.first_name} {user?.last_name}
            </h3>
            <p className="text-zinc-500 text-sm mt-1 mb-4">{user?.email}</p>
            
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg text-xs font-bold uppercase tracking-widest border border-amber-200 dark:border-amber-900/30">
              {summary.status}
            </span>
            
            <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800 my-8"></div>
            
            <div className="space-y-5 text-left">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-500">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Phone</p>
                  <p className="text-sm font-semibold dark:text-zinc-200">{user?.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-500">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Date of Birth</p>
                  <p className="text-sm font-semibold dark:text-zinc-200">{user?.dob}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left">
              <Printer size={18} className="text-zinc-400" />
              Print Report
            </button>
            <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-colors text-left">
              <RefreshCw size={18} className="text-orange-400" />
              Run All Re-verifications
            </button>
            <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-left">
              <Trash2 size={18} className="text-red-400" />
              Delete Record
            </button>
          </div>
        </div>

        {/* Right Column - Verification Stats */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-500">
                <BadgeInfo size={20} />
              </div>
              <h4 className="text-lg font-bold dark:text-white">Identity & Compliance</h4>
            </div>
            
            <div className="space-y-1">
              <DetailRow title="Aadhar Number" content={metadata?.aadhar_number} />
              <DetailRow title="PAN Number" content={metadata?.pan_number} />
              <DetailRow title="Submitted On" content={new Date(summary.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })} />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
            <div className="flex items-center gap-3 px-8 pt-8 mb-6">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-500">
                <CheckCircle2 size={20} />
              </div>
              <h4 className="text-lg font-bold dark:text-white">Verification Results</h4>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-y border-zinc-100 dark:border-zinc-800">
                    <th className="py-4 px-8 text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Checkpoint</th>
                    <th className="py-4 px-8 text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Status</th>
                    <th className="py-4 px-8 text-[10px] font-bold uppercase text-zinc-400 tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {Object.entries(verification_results || {}).map(([key, value]) => (
                    <tr key={key} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                      <td className="py-5 px-8 text-sm font-semibold dark:text-zinc-200">{key}</td>
                      <td className="py-5 px-8"><StatusChip status={value} /></td>
                      <td className="py-5 px-8 text-right">
                        <button 
                          className="p-2 text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-all"
                          title="Re-verify this specific item"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
