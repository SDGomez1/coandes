"use client";

import { useQuery } from "convex/react";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Papa from "papaparse";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";

export default function LoteDetailsPage({ params }: { params: { loteId: Id<"inventoryLots"> } }) {
    return <></>
   }
