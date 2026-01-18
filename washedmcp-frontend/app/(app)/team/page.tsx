'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Circle, Clock, Crown, User, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAppLoadAnimation } from '@/components/layout/AppLoadProvider';
import type { TeamMemberApiResponse } from '@/lib/types/data';

// Deterministic gradient generator based on user ID
const getAvatarGradient = (userId: string) => {
  const colors = [
    ['#0EA5E9', '#06B6D4'], // Primary to Secondary
    ['#06B6D4', '#14B8A6'], // Secondary to Tertiary
    ['#8B5CF6', '#EC4899'], // Purple to Pink
    ['#EC4899', '#F59E0B'], // Pink to Orange
    ['#F59E0B', '#10B981'], // Orange to Green
    ['#10B981', '#0EA5E9'], // Green to Primary
  ];

  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % colors.length;
  return colors[index];
};

const syncStatusConfig = {
  synced: { color: 'text-(--color-success)', bgColor: 'bg-(--color-success)', label: 'Synced' },
  syncing: { color: 'text-(--color-warning)', bgColor: 'bg-(--color-warning)', label: 'Syncing...' },
  offline: { color: 'text-(--color-text-tertiary)', bgColor: 'bg-(--color-text-tertiary)', label: 'Offline' },
};

const roleConfig = {
  owner: { icon: Crown, label: 'Owner', color: 'text-(--color-warning)' },
  admin: { icon: User, label: 'Admin', color: 'text-(--color-primary)' },
  member: { icon: User, label: 'Member', color: 'text-(--color-text-secondary)' },
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMemberApiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { shouldAnimate, ready } = useAppLoadAnimation();
  const pageMotion = shouldAnimate
    ? { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }
    : { initial: false, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } };

  useEffect(() => {
    async function fetchTeamMembers() {
      try {
        const response = await fetch('/api/team');
        if (!response.ok) {
          throw new Error('Failed to fetch team members');
        }
        const data = await response.json();
        setTeamMembers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchTeamMembers();
  }, []);

  if (!ready) {
    return <div className="min-h-screen p-6 opacity-0" />;
  }

  if (loading) {
    return (
      <motion.div className="min-h-screen p-6 flex items-center justify-center" {...pageMotion}>
        <div className="flex items-center gap-3 text-(--color-text-secondary)">
          <Loader2 className="animate-spin" size={24} />
          <span>Loading team members...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div className="min-h-screen p-6" {...pageMotion}>
        <div className="bg-(--color-error)/10 border border-(--color-error) rounded-[6px] p-4 text-(--color-error)">
          Error loading team members: {error}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="min-h-screen p-6" {...pageMotion}>
      {/* Header Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-(--color-text-primary) mb-1">
            Team Management
          </h1>
          <p className="text-(--color-text-secondary) text-base">
            Collaborate with your team in real-time
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-(--color-primary) text-white rounded-[6px] font-medium shadow-[--shadow-subtle] transition-colors duration-200 hover:bg-(--color-primary-hover)"
        >
          <UserPlus size={20} />
          Invite Member
        </motion.button>
      </div>

      {/* Team Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-3 gap-5 mb-6"
      >
        <div className="bg-(--color-surface) rounded-[6px] border border-(--color-border) shadow-[--shadow-subtle] p-5">
          <p className="text-sm text-(--color-text-tertiary) mb-2">Total Members</p>
          <p className="text-2xl font-semibold text-(--color-text-primary)">{teamMembers.length}</p>
        </div>
        <div className="bg-(--color-surface) rounded-[6px] border border-(--color-border) shadow-[--shadow-subtle] p-5">
          <p className="text-sm text-(--color-text-tertiary) mb-2">Active Now</p>
          <p className="text-2xl font-semibold text-(--color-success)">
            {teamMembers.filter(m => m.syncStatus !== 'offline').length}
          </p>
        </div>
        <div className="bg-(--color-surface) rounded-[6px] border border-(--color-border) shadow-[--shadow-subtle] p-5">
          <p className="text-sm text-(--color-text-tertiary) mb-2">Syncing</p>
          <p className="text-2xl font-semibold text-(--color-warning)">
            {teamMembers.filter(m => m.syncStatus === 'syncing').length}
          </p>
        </div>
      </motion.div>

      {/* Team Members List */}
      <motion.div
        variants={container}
        initial={shouldAnimate ? 'hidden' : false}
        animate="show"
        className="space-y-4"
      >
        {teamMembers.map((member) => {
          const [gradientStart, gradientEnd] = getAvatarGradient(member.id);
          const roleKey = member.role as keyof typeof roleConfig;
          const syncKey = member.syncStatus as keyof typeof syncStatusConfig;
          const RoleIcon = roleConfig[roleKey].icon;

          return (
            <motion.div
              key={member.id}
              variants={item}
              className="bg-(--color-surface) rounded-[6px] border border-(--color-border) shadow-[--shadow-subtle] p-5 transition-colors duration-200 hover:border-(--color-primary)"
            >
              <div className="flex items-center justify-between">
                {/* Left Section: Avatar + Info */}
                <div className="flex items-center gap-4">
                  {/* Deterministic Gradient Avatar */}
                  <div
                    className="w-12 h-12 rounded-[6px] flex items-center justify-center text-white text-base font-semibold"
                    style={{
                      background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
                    }}
                  >
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-(--color-text-primary)">
                        {member.name}
                      </h3>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-(--color-background)`}>
                        <RoleIcon className={roleConfig[roleKey].color} size={14} />
                        <span className={`text-xs font-medium ${roleConfig[roleKey].color}`}>
                          {roleConfig[roleKey].label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-(--color-text-secondary)">
                      <div className="flex items-center gap-2">
                        <Mail size={14} />
                        {member.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        Active {formatDistanceToNow(new Date(member.lastActive), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section: Sync Status */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={member.syncStatus === 'syncing' ? { opacity: [1, 0.6, 1] } : {}}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    >
                      <Circle
                        className={syncStatusConfig[syncKey].color}
                        size={12}
                        fill="currentColor"
                      />
                    </motion.div>
                    <span className={`text-sm font-medium ${syncStatusConfig[syncKey].color}`}>
                      {syncStatusConfig[syncKey].label}
                    </span>
                  </div>

                  {member.role !== 'owner' && (
                    <button className="px-4 py-2 border border-(--color-border) rounded-[6px] text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-background) transition-colors duration-200">
                      Manage
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Invite Modal (Simple version - would be a proper modal in production) */}
      {showInviteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
          onClick={() => setShowInviteModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="bg-(--color-surface) rounded-[6px] border border-(--color-border) shadow-[--shadow-modal] p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-(--color-text-primary) mb-2">
              Invite Team Member
            </h2>
            <p className="text-(--color-text-secondary) mb-6">
              Send an invitation link that expires in 7 days
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-(--color-text-primary) mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="colleague@example.com"
                  className="w-full h-[44px] px-4 bg-(--color-surface) border border-(--color-border) rounded-[6px] text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none focus:ring-3 focus:ring-(--color-primary)/20 focus:border-(--color-primary) transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-(--color-text-primary) mb-2">
                  Role
                </label>
                <select className="w-full h-[44px] px-4 bg-(--color-surface) border border-(--color-border) rounded-[6px] text-(--color-text-primary) focus:outline-none focus:ring-3 focus:ring-(--color-primary)/20 focus:border-(--color-primary) transition-all duration-200">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-3 bg-(--color-primary) text-white rounded-[6px] font-medium hover:bg-(--color-primary-hover) transition-colors duration-200"
              >
                Send Invitation
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowInviteModal(false)}
                className="px-6 py-3 border border-(--color-border) rounded-[6px] font-medium text-(--color-text-secondary) hover:bg-(--color-background) transition-colors duration-200"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
