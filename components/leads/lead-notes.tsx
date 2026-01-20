"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { LeadNote, Profile } from "@/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { Send, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { logActivity } from "@/lib/logger"

interface LeadNotesProps {
    leadId: string
    currentUserId?: string
}

export function LeadNotes({ leadId, currentUserId }: LeadNotesProps) {
    const [notes, setNotes] = useState<LeadNote[]>([])
    const [newNote, setNewNote] = useState("")
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const supabase = createClient()
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchNotes()
    }, [leadId])

    useEffect(() => {
        // Scroll to bottom on load and new messages
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [notes])

    async function fetchNotes() {
        setLoading(true)
        const { data, error } = await supabase
            .from('lead_notes')
            .select(`
                *,
                user:profiles(id, full_name, email, avatar_url)
            `)
            .eq('lead_id', leadId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error("Error fetching notes:", error)
            toast.error("Failed to load notes")
        } else {
            setNotes(data || [])
        }
        setLoading(false)
    }

    async function handleSend() {
        if (!newNote.trim()) return
        setSending(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast.error("You must be logged in")
            setSending(false)
            return
        }

        const { error } = await supabase
            .from('lead_notes')
            .insert({
                lead_id: leadId,
                user_id: user.id,
                content: newNote.trim()
            })

        if (error) {
            toast.error("Failed to send note")
        } else {
            setNewNote("")
            fetchNotes() // Refresh to show new note with user details
            await logActivity('Note Added', 'lead', leadId)
        }
        setSending(false)
    }

    async function handleDelete(noteId: string) {
        // Optimistic update
        setNotes(notes.filter(n => n.id !== noteId))

        const { error } = await supabase
            .from('lead_notes')
            .delete()
            .eq('id', noteId)

        if (error) {
            toast.error("Failed to delete note")
            fetchNotes() // Revert on error
        }
    }

    if (loading) {
        return <div className="p-4 text-center text-sm text-muted-foreground">Loading notes...</div>
    }

    return (
        <div className="flex flex-col h-[500px] border rounded-md">
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50">
                {notes.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10 text-sm">
                        No notes yet. Start the conversation!
                    </div>
                ) : (
                    notes.map((note) => {
                        const isMe = note.user_id === currentUserId
                        return (
                            <div key={note.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                <Avatar className="h-8 w-8 mt-1">
                                    <AvatarImage src={note.user?.avatar_url || ""} />
                                    <AvatarFallback className="text-xs">
                                        {note.user?.full_name?.substring(0, 2).toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={`group flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-xs font-semibold text-gray-700">
                                            {note.user?.full_name || 'User'}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {format(new Date(note.created_at), "MMM d, h:mm a")}
                                        </span>
                                        {isMe && (
                                            <button
                                                onClick={() => handleDelete(note.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                                                title="Delete note"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                    <div className={`px-4 py-2 rounded-lg text-sm shadow-sm ${isMe
                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                            : 'bg-white border rounded-tl-none'
                                        }`}>
                                        {note.content}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={scrollRef} />
            </div>

            <div className="p-3 border-t bg-white">
                <div className="flex gap-2">
                    <Textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Type a note..."
                        className="min-h-[2.5rem] max-h-32 resize-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={sending || !newNote.trim()}
                        className="h-auto w-12 shrink-0"
                    >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 ml-1">
                    Press Enter to send, Shift + Enter for new line
                </p>
            </div>
        </div>
    )
}
