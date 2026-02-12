"use client"; // This is the key!

import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Link
} from "@heroui/react";

export default function ArchiveTable({ files }: { files: any[] }) {
    return (
        <Table aria-label="Archive files table" shadow="sm">
            <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>SIZE (MB)</TableColumn>
                <TableColumn>CREATED AT</TableColumn>
            </TableHeader>
            <TableBody emptyContent={"No archive files found."}>
                {files.map((file, index) => (
                    <TableRow key={index}>
                        <TableCell>
                            <Link isExternal showAnchorIcon href={file.href} download={file.name} size="sm">
                                {file.name}
                            </Link>
                        </TableCell>
                        <TableCell className="font-mono text-default-600">{file.size} MB</TableCell>
                        <TableCell className="text-default-500">
                            {new Date(file.createdAt).toLocaleString()}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}