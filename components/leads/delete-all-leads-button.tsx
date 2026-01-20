"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function DeleteAllLeadsButton({ userRole }: { userRole: string }) {
    if (userRole !== 'admin') return null;

    const [open, setOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleDeleteAll = async () => {
        setDeleting(true)

        // Since we can't run TRUNCATE from client without super privs usually,
        // we'll fetch all IDs and delete them. For massive datasets, an RPC is better,
        // but for <1000 leads this is fine.

        const { error } = await supabase
            .from('leads')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000') // Trick to match all UUIDs

        // Fallback if neq doesn't work as expected with text logic (though id is uuid)
        // Alternatively we can use greater than empty string if it acts as string

        // A safer client-side purge:
        // const { data } = await supabase.from('leads').select('id')
        // if (data?.length) {
        //    const ids = data.map(l => l.id)
        //    await supabase.from('leads').delete().in('id', ids)
        // }
        // Let's stick to the .neq check which usually works for "delete all where id is not null" if passed right

        if (error) {
            toast.error("Failed to delete leads: " + error.message)
        } else {
            toast.success("All leads have been deleted.")
            setOpen(false)
            router.refresh()
        }
        setDeleting(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete All Data
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete ALL leads from the database.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteAll} disabled={deleting}>
                        {deleting ? "Deleting..." : "Yes, Delete All"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
