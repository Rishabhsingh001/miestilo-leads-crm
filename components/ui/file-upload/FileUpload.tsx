"use client";

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, X, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: Record<string, string[]>;
    maxSize?: number; // In bytes
    label?: string;
}

export default function FileUpload({
    onFileSelect,
    accept = {
        'text/csv': ['.csv'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls']
    },
    maxSize = 5 * 1024 * 1024, // 5MB
    label = "Drag & drop CSV or Excel file here"
}: FileUploadProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
        setError(null);
        if (fileRejections.length > 0) {
            const msg = fileRejections[0].errors[0].message;
            setError(msg);
            return;
        }

        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setSelectedFile(file);
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxSize,
        maxFiles: 1
    });

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
    };

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={cn(
                    "relative flex flex-col items-center justify-center w-full p-10 border-2 border-dashed rounded-xl transition-all cursor-pointer bg-gray-50/50 hover:bg-gray-50",
                    isDragActive ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-gray-300 hover:border-primary/50",
                    error ? "border-red-300 bg-red-50" : "",
                    selectedFile ? "border-green-300 bg-green-50/30" : ""
                )}
            >
                <input {...getInputProps()} />

                {selectedFile ? (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                            {selectedFile.name.endsWith('.csv') ? <FileText className="w-8 h-8" /> : <FileSpreadsheet className="w-8 h-8" />}
                        </div>
                        <p className="font-medium text-gray-900 text-lg">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500 mb-4">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        <button
                            onClick={clearFile}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 text-sm font-medium rounded-full shadow-sm border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                        >
                            <X className="w-4 h-4" /> Change File
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                            <Upload className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-semibold text-gray-700">
                                {isDragActive ? "Drop it like it's hot!" : label}
                            </p>
                            <p className="text-sm text-gray-500">
                                Supports .csv, .xlsx, .xls up to {maxSize / 1024 / 1024}MB
                            </p>
                        </div>
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    {error}
                </p>
            )}
        </div>
    );
}
