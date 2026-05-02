import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import Papa from 'papaparse';
import { Lead, LeadStatus } from '../types';

export async function syncLeadsFromGoogleSheet() {
  if (!auth.currentUser) return { success: false, message: 'User not authenticated' };

  try {
    // 1. Get Sync Config
    const configSnap = await getDoc(doc(db, 'settings', auth.currentUser.uid));
    if (!configSnap.exists()) return { success: false, message: 'No sync source configured' };
    
    const { googleSheetUrl } = configSnap.data();
    if (!googleSheetUrl) return { success: false, message: 'Source URL empty' };

    // 2. Fetch CSV
    const response = await fetch(googleSheetUrl);
    const csvData = await response.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const externalLeads = results.data as any[];
          
          if (externalLeads.length === 0) {
            resolve({ success: true, count: 0 });
            return;
          }

          // 3. Get existing externalIds to avoid duplicates
          const q = query(
            collection(db, 'leads'),
            where('ownerId', '==', auth.currentUser!.uid)
          );
          const existingSnap = await getDocs(q);
          const existingExternalIds = new Set(
            existingSnap.docs
              .map(d => (d.data() as Lead).externalId)
              .filter(id => !!id)
          );

          // 4. Batch injection
          const batch = writeBatch(db);
          let newCount = 0;

          externalLeads.forEach(row => {
            // Use 'id' from sheet or fallback to email to create a stable externalId
            const extId = row.id || row.email || `${row.name}-${row.company}`;
            
            if (!existingExternalIds.has(extId)) {
                const newLeadRef = doc(collection(db, 'leads'));
                const status = (row.status?.toLowerCase() || 'new') as LeadStatus;
                
                batch.set(newLeadRef, {
                    name: row.name || 'External Entry',
                    company: row.company || 'Unknown Source',
                    value: parseFloat(row.value) || 0,
                    email: row.email || '',
                    phone: row.phone || '',
                    status: ['new', 'qualified', 'proposal', 'closed'].includes(status) ? status : 'new',
                    externalId: extId,
                    ownerId: auth.currentUser!.uid,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                newCount++;
            }
          });

          if (newCount > 0) {
            await batch.commit();
            await setDoc(doc(db, 'settings', auth.currentUser!.uid), {
                lastSync: serverTimestamp()
            }, { merge: true });
          }

          resolve({ success: true, count: newCount });
        },
        error: (err) => resolve({ success: false, message: err.message })
      });
    });

  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
