
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const sheetUrl = searchParams.get('url')

    if (!sheetUrl) {
        return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 })
    }

    try {
        // Simple heuristic to convert standard edit URL to export URL
        // From: https://docs.google.com/spreadsheets/d/DOC_ID/edit...
        // To:   https://docs.google.com/spreadsheets/d/DOC_ID/export?format=csv

        let exportUrl = sheetUrl
        const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)

        if (match && match[1]) {
            exportUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`
        }

        const response = await fetch(exportUrl)

        if (!response.ok) {
            throw new Error(`Failed to fetch sheet: ${response.statusText}`)
        }

        const csvText = await response.text()

        return new NextResponse(csvText, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="sheet.csv"'
            }
        })
    } catch (error: any) {
        console.error("Sheet Proxy Error:", error)
        return NextResponse.json({ error: "Failed to download sheet. Ensure it is publicly accessible via link." }, { status: 500 })
    }
}
