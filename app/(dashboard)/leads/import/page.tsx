"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button'; // Assuming Button component exists
import FileUpload from '@/components/ui/file-upload/FileUpload';
import { ChevronRight, UploadCloud, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createLeads } from '@/services/api';
import { Lead } from '@/types';

type ImportStep = 'upload' | 'preview' | 'importing' | 'success';

export default function ImportLeadsPage() {
    const router = useRouter();
    const [step, setStep] = useState<ImportStep>('upload');
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [mappedLeads, setMappedLeads] = useState<Partial<Lead>[]>([]);
    const [fileName, setFileName] = useState('');
    const [stats, setStats] = useState({ total: 0, success: 0 });

    const handleFileSelect = (file: File) => {
        setFileName(file.name);
        if (file.name.endsWith('.csv')) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setParsedData(results.data);
                    processData(results.data);
                    setStep('preview');
                }
            });
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target?.result as string;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet);
                setParsedData(json);
                processData(json);
                setStep('preview');
            };
            reader.readAsBinaryString(file);
        }
    };

    // Naive auto-mapping
    const processData = (data: any[]) => {
        const mapped = data.map(row => {
            // Try to fuzzy match common headers
            // Keys in row might be "Company Name", "Phone No", etc.
            const normalize = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

            const findValue = (keys: string[]) => {
                for (const k of Object.keys(row)) {
                    if (keys.includes(normalize(k))) return row[k];
                }
                return undefined;
            };

            return {
                company_name: findValue(['companyname', 'company', 'businessname', 'name']) || row['Company'] || 'Unknown Company',
                contact_person: findValue(['contactperson', 'contact', 'person', 'fullname']) || row['Contact'] || '-',
                phone: findValue(['phone', 'phonenumber', 'mobile', 'whatsapp', 'cell']) || row['Phone'] || '0000000000',
                email: findValue(['email', 'emailaddress', 'mail']) || '',
                product_interest: findValue(['product', 'interest', 'category']) || 'Bra',
                lead_source: 'Import',
                city: findValue(['city', 'town', 'location']) || '',
                status: 'New'
            } as Partial<Lead>;
        });
        setMappedLeads(mapped);
    };

    const handleImport = async () => {
        setStep('importing');
        try {
            const count = await createLeads(mappedLeads);
            setStats({ total: mappedLeads.length, success: count });
            setStep('success');
        } catch (e) {
            alert('Import failed');
            setStep('preview');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Import Leads</h1>
                <p className="text-muted-foreground">Bulk upload leads from CSV or Excel files.</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 text-sm font-medium">
                <div className={`flex items-center gap-2 ${step !== 'upload' ? 'text-green-600' : 'text-primary'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step !== 'upload' ? 'border-green-600 bg-green-50' : 'border-primary bg-primary/10'}`}>1</div>
                    Upload
                </div>
                <div className="w-10 h-0.5 bg-gray-200" />
                <div className={`flex items-center gap-2 ${['preview', 'importing', 'success'].includes(step) ? (step === 'success' ? 'text-green-600' : 'text-primary') : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${['preview', 'importing', 'success'].includes(step) ? (step === 'success' ? 'border-green-600 bg-green-50' : 'border-primary bg-primary/10') : 'border-gray-200'}`}>2</div>
                    Verify
                </div>
                <div className="w-10 h-0.5 bg-gray-200" />
                <div className={`flex items-center gap-2 ${step === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'success' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>3</div>
                    Done
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border min-h-[400px]">

                {step === 'upload' && (
                    <div className="max-w-xl mx-auto space-y-6">
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-semibold text-gray-900">Upload your file</h3>
                            <p className="text-sm text-gray-500">
                                Ensure your file has headers like <span className="font-mono bg-gray-100 px-1">Name</span>, <span className="font-mono bg-gray-100 px-1">Phone</span>, <span className="font-mono bg-gray-100 px-1">Email</span>.
                            </p>
                        </div>
                        <FileUpload onFileSelect={handleFileSelect} />
                        <div className="flex justify-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Auto-column mapping</span>
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Duplicate detection</span>
                        </div>
                    </div>
                )}

                {step === 'preview' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Preview Data</h3>
                                <p className="text-sm text-gray-500">Found {mappedLeads.length} leads in <span className="font-medium text-gray-900">{fileName}</span></p>
                            </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3">Company</th>
                                        <th className="px-4 py-3">Contact</th>
                                        <th className="px-4 py-3">Phone</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Product</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {mappedLeads.slice(0, 10).map((lead, i) => (
                                        <tr key={i} className="bg-white hover:bg-gray-50">
                                            <td className="px-4 py-2 font-medium">{lead.company_name}</td>
                                            <td className="px-4 py-2">{lead.contact_person}</td>
                                            <td className="px-4 py-2 text-gray-500">{lead.phone}</td>
                                            <td className="px-4 py-2 text-gray-500">{lead.email || '-'}</td>
                                            <td className="px-4 py-2">
                                                <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                                                    {lead.product_interest}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {mappedLeads.length > 10 && (
                                <div className="px-4 py-2 bg-gray-50 text-xs text-center text-gray-500 border-t">
                                    ... and {mappedLeads.length - 10} more rows
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => { setStep('upload'); setMappedLeads([]); }}>Cancel</Button>
                            <Button onClick={handleImport} className="gap-2">
                                <UploadCloud className="w-4 h-4" />
                                Import {mappedLeads.length} Leads
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'importing' && (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Importing Leads...</h3>
                        <p className="text-gray-500">Please wait while we process your file.</p>
                    </div>
                )}

                {step === 'success' && (
                    <div className="flex flex-col items-center justify-center h-64 space-y-6 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-gray-900">Import Successful!</h3>
                            <p className="text-gray-500">Successfully added {stats.success} new leads to your pipeline.</p>
                        </div>
                        <div className="flex gap-4">
                            <Button variant="outline" onClick={() => { setStep('upload'); setMappedLeads([]); }}>Import Another</Button>
                            <Button onClick={() => router.push('/leads')}>View Leads</Button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
