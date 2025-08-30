import { Button } from "@/components/ui/button"
import Link from 'next/link'

export default function Expenses() {
    return (
        <>
            <Link href='/add'>
                <Button>New Expense</Button>
            </Link>
        </>)
}