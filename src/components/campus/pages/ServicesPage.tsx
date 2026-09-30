import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  GraduationCap,
  Search,
  Phone,
  MapPin,
  CheckCircle,
} from 'lucide-react';

interface ServicesPageProps {
  onBack: () => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = () => {
  const { campusServices, openModal, selectedUniversity, student } = useApp();
  const activeUni = selectedUniversity || student?.university || 'ISBAT University';
  const [search, setSearch] = useState('');

  const scopedServices = useMemo(() => {
    return campusServices.filter((s) => !s.university || s.university === activeUni);
  }, [campusServices, activeUni]);

  const filtered = useMemo(() => {
    return scopedServices.filter((s) => {
      return (
        !search.trim() ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.department.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.quickServices.some((qs) => qs.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [scopedServices, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-[#0891B2] via-[#0E7490] to-[#155E75] text-white shadow-xl border border-white/[0.1]">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-200">
              <span className="bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {activeUni.split(' ')[0]} Services Directory
              </span>
              <span>·</span>
              <span>{scopedServices.length} Offices</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Campus Services & Directory
            </h1>
            <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
              Official university contact lines, library support, ICT helpdesk, student health centre, and academic registrar offices.
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by department, service (e.g. WiFi, Transcripts, Health), or office..."
          className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#13141F] border border-white/[0.08] text-xs sm:text-sm font-semibold text-white placeholder:text-zinc-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
        />
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((service) => (
          <div
            key={service.id}
            onClick={() => openModal('campus-service-detail', service)}
            className="ios-liquid-card p-5 card-soft-hover cursor-pointer shadow-hi-fi-md flex flex-col justify-between liquid-sheen space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform shadow-xs shrink-0">
                    <GraduationCap className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                      {service.name}
                    </h3>
                    <p className="text-xs text-zinc-400 font-semibold">{service.department}</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-zinc-400 bg-[#1A1C2B] px-2.5 py-0.5 rounded-full border border-white/[0.06] shrink-0">
                  {service.hours}
                </span>
              </div>

              <div className="space-y-1 text-xs text-zinc-400 font-medium">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="truncate">{service.location}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {service.description}
              </p>

              {/* Quick Services Checklist */}
              <div className="pt-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Available Services
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {service.quickServices.map((qs, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-[#181A27] border border-white/[0.06] text-[11px] font-semibold text-zinc-300 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3 text-cyan-400" />
                      <span>{qs}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-semibold truncate">
                {service.contactEmail}
              </span>

              <a
                href={`tel:${service.contactPhone}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-1.5 rounded-full text-white font-bold shadow-xs flex items-center gap-1.5 hover:scale-105 transition-transform"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call {service.contactPhone}</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
