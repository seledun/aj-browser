'use client'
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, NavbarMenu, NavbarMenuToggle, NavbarMenuItem, Divider } from "@heroui/react";
import { useState } from "react";
import Image from "next/image";

export const AcmeLogo = () => {
    return (
        <svg fill="none" height="36" viewBox="0 0 32 32" width="36">
            <path
                clipRule="evenodd"
                d="M17.6482 10.1305L15.8785 7.02583L7.02979 22.5499H10.5278L17.6482 10.1305ZM19.8798 14.0457L18.11 17.1983L19.394 19.4511H16.8453L15.1056 22.5499H24.7272L19.8798 14.0457Z"
                fill="currentColor"
                fillRule="evenodd"
            />
        </svg>
    );
};

export default function MainNavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <Navbar>
            <NavbarContent className="hidden sm:flex gap-8" justify="start">
                <NavbarBrand className="pr-4">
                    <p className="font-bold text-inherit mx-2">bland.video</p>
                </NavbarBrand>
                <NavbarItem>
                    <Link className="text-foreground! no-underline!" color="foreground" href="/">
                        Videos
                    </Link>
                </NavbarItem>
                <NavbarItem>
                    <Link className="text-foreground! no-underline!" aria-current="page" href="/comments">
                        Comments
                    </Link>
                </NavbarItem>
                <NavbarItem>
                    <Link className="text-foreground! no-underline!" color="foreground" href="/archives">
                        Archives
                    </Link>
                </NavbarItem>
                <NavbarItem>
                    <Link className="text-foreground! no-underline!" color="foreground" href="/about">
                        About
                    </Link>
                </NavbarItem>
            </NavbarContent>
            <NavbarContent className="grow" justify="end">
                <NavbarMenuToggle
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    className="sm:hidden"
                />
            </NavbarContent>
            <NavbarMenu className="z-50">
                <NavbarMenuItem>
                    <h1>Browse archive</h1>
                </NavbarMenuItem>
                <NavbarMenuItem>
                    <Link className="text-foreground! no-underline!" color="foreground" href="/">
                        Videos
                    </Link>
                </NavbarMenuItem>
                <NavbarMenuItem>
                    <Link className="text-foreground! no-underline!" aria-current="page" href="/comments">
                        Comments
                    </Link>
                </NavbarMenuItem>
                <NavbarMenuItem className="mt-3">
                    <h1>About project</h1>
                </NavbarMenuItem>
                <NavbarMenuItem>
                    <Link className="text-foreground! no-underline!" color="foreground" href="/archives">
                        Archives
                    </Link>
                </NavbarMenuItem>
                <NavbarMenuItem>
                    <Link className="text-foreground! no-underline!" color="foreground" href="/about">
                        About
                    </Link>
                </NavbarMenuItem>
            </NavbarMenu>
        </Navbar>
    );
}