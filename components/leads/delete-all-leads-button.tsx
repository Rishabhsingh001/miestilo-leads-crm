
"use client"

import { Button } from "@/components/ui/button"
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
import { deleteAllLeadsAction } from "@/app/actions"

export function DeleteAllLeadsButton({ userRole }: { userRole: string }) {
    if (userRole !== 'admin') return null;

    const [open, setOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const router = useRouter()

    const handleDeleteAll = async () => {
        setDeleting(true)

        const result = await deleteAllLeadsAction()

        if ('error' in result && result.error) {
            toast.error("Failed to delete leads")
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
