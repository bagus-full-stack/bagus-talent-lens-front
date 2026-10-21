import React from 'react';
import { notFound } from 'next/navigation';
import { Users, UserPlus, ShieldCheck, Mail, Shield } from 'lucide-react';
import { getFolderRepository } from '@/lib/api';
import { mockMemberships } from '@/lib/mock/data/organizations';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MembresTabProps {
  params: Promise<{ id: string }>;
}

export default async function MembresTab({ params }: MembresTabProps) {
  const { id } = await params;

  const folder = await getFolderRepository().getById(id);
  if (!folder) notFound();

  // Membres assignés à ce dossier
  const assigned = mockMemberships.filter((m) =>
    folder.assignedMemberIds.includes(m.userId),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <span>Membres habilités sur le dossier</span>
          </h2>
          <p className="text-xs text-slate-500">
            Équipe de recrutement intervenant sur cette campagne sous contrôle de rôles RBAC.
          </p>
        </div>

        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs h-9">
          <UserPlus className="h-4 w-4" />
          <span>Assigner un membre</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assigned.map((member) => (
          <Card key={member.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold text-xs text-white">
                {member.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block">
                  {member.fullName}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3 w-3" />
                  <span>{member.email}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize text-xs">
                {member.role}
              </Badge>
              {member.can_reveal_identity && (
                <span
                  title="Habilité à la levée d’anonymat Art. 30"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                >
                  <ShieldCheck className="h-4 w-4" />
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
