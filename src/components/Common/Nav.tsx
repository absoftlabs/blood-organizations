'use client'
import { IconDropletPlus, IconHome, IconUserSquareRounded } from '@tabler/icons-react'
import Link from 'next/link'
import React from 'react'

function Nav() {
    return (
        <div className="dock md:hidden bg-primary text-white">
            <Link href="/">
                <IconHome size={24} stroke={1.5} />
                <span className="dock-label">হোম</span>
            </Link>

            <Link href={'/request-blood'} className="dock-active">
                <IconDropletPlus/>
                <span className="dock-label">ব্লাড রিকুয়েস্ট</span>
            </Link>

            <Link href={'/profile'}>
                <IconUserSquareRounded/>
                <span className="dock-label">প্রোফাইল</span>
            </Link>
        </div>
    )
}

export default Nav