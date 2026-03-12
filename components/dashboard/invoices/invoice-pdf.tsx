"use client";

import dynamic from "next/dynamic";
import { Invoice } from "./invoices-columns";
import { Download } from "lucide-react";
import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => <span className="text-muted-foreground text-sm flex items-center"><Download className="h-4 w-4 mr-2" /> Preparing PDF...</span>,
  }
);

const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    color: "#000000",
    fontSize: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: "column",
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  companyDetails: {
    fontSize: 9,
    color: "#444444",
    marginTop: 4,
    lineHeight: 1.4,
  },
  headerRight: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  invoiceTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#000000",
    letterSpacing: 2,
  },
  metaSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  billToBlock: {
    flex: 1,
  },
  infoBlock: {
    width: 180,
    alignItems: "flex-end",
  },
  metaLabel: {
    fontSize: 8,
    color: "#000000",
    textTransform: "uppercase",
    marginBottom: 4,
    fontWeight: "bold",
  },
  metaValue: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 2,
  },
  metaSubValue: {
    fontSize: 9,
    color: "#444444",
    marginTop: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
    width: "100%",
  },
  infoLabel: {
    fontSize: 8,
    color: "#666666",
    textTransform: "uppercase",
    width: 80,
    textAlign: "left",
  },
  infoValue: {
    fontSize: 10,
    fontWeight: "bold",
    width: 100,
    textAlign: "right",
  },
  table: {
    marginTop: 20,
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#000000",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 1.5, textAlign: "center" },
  colAmount: { flex: 1.5, textAlign: "right" },

  descriptionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  descriptionSub: {
    fontSize: 8,
    color: "#666666",
  },

  summaryContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  summaryBlock: {
    width: 200,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  summaryLabel: {
    fontSize: 9,
    color: "#666666",
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: "bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#000000",
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 13,
    fontWeight: "bold",
  },

  detailsSection: {
    marginTop: 50,
    flexDirection: "row",
  },
  detailsCol: {
    flex: 1,
    marginRight: 40,
  },
  detailsTitle: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 4,
  },
  detailsText: {
    fontSize: 8,
    color: "#444444",
    lineHeight: 1.5,
  },

  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 60,
    paddingBottom: 40,
  },
  signatureBlock: {
    width: 200,
    borderTopWidth: 1,
    borderTopColor: "#000000",
    paddingTop: 8,
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },
  signatureSub: {
    fontSize: 8,
    color: "#666666",
    textAlign: "center",
    marginTop: 2,
  },

  pageNumber: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#999999",
    fontSize: 8,
  }
});

export const InvoiceDocument = ({ invoice }: { invoice: Invoice }) => {
  const formattedAmount = (val: number) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(val || 0);

  const issueDate = new Date(invoice.issue_date);
  const dueDate = new Date(invoice.due_date);

  return (
    <Document title={`Invoice ${invoice.invoice_number}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image src="d:/Website Templates/Neura Labs Dashboard/app/favicon.ico" style={styles.logo} />
            <Text style={styles.companyName}>NeoSparkX</Text>
            <Text style={styles.companyDetails}>
              hello@neosparkx.com{"\n"}
              www.neosparkx.com{"\n"}
              Dhaka, Bangladesh
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={{ marginTop: 10 }}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Invoice No:</Text>
                <Text style={styles.infoValue}>#{invoice.invoice_number}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date:</Text>
                <Text style={styles.infoValue}>{issueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={[styles.infoValue, { color: invoice.status === 'Paid' ? '#059669' : '#DC2626' }]}>{invoice.status}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.metaSection}>
          <View style={styles.billToBlock}>
            <Text style={styles.metaLabel}>Bill To:</Text>
            <Text style={styles.metaValue}>{invoice.client_name}</Text>
            <Text style={styles.metaSubValue}>{invoice.client_address || "Client Address details not provided"}</Text>
            {invoice.client_email && <Text style={styles.metaSubValue}>{invoice.client_email}</Text>}
            {invoice.client_phone && <Text style={styles.metaSubValue}>{invoice.client_phone}</Text>}
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.metaLabel}>Payment Due:</Text>
            <Text style={[styles.metaValue, { fontSize: 13, color: '#DC2626' }]}>
              {dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colDesc}><Text style={styles.tableHeaderText}>Description</Text></View>
            <View style={styles.colQty}><Text style={styles.tableHeaderText}>Qty</Text></View>
            <View style={styles.colPrice}><Text style={styles.tableHeaderText}>Price</Text></View>
            <View style={styles.colAmount}><Text style={styles.tableHeaderText}>Amount</Text></View>
          </View>

          <View style={styles.tableRow}>
            <View style={styles.colDesc}>
              <Text style={styles.descriptionTitle}>Standard Project Deliverables</Text>
              <Text style={styles.descriptionSub}>Professional services and implementation as per scope of work.</Text>
            </View>
            <View style={styles.colQty}><Text>1</Text></View>
            <View style={styles.colPrice}><Text>{formattedAmount(invoice.amount)}</Text></View>
            <View style={styles.colAmount}><Text style={{ fontWeight: "bold" }}>{formattedAmount(invoice.amount)}</Text></View>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBlock}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formattedAmount(invoice.amount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount (0%)</Text>
              <Text style={styles.summaryValue}>$0.00</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (0%)</Text>
              <Text style={styles.summaryValue}>$0.00</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL AMOUNT DUE</Text>
              <Text style={styles.totalValue}>{formattedAmount(invoice.amount)}</Text>
            </View>
          </View>
        </View>

        {/* Details Footer */}
        <View style={styles.detailsSection}>
          <View style={styles.detailsCol}>
            <Text style={styles.detailsTitle}>Payment Info</Text>
            <Text style={styles.detailsText}>Bank: Example International Bank</Text>
            <Text style={styles.detailsText}>A/C Name: NeoSparkX Agency</Text>
            <Text style={styles.detailsText}>A/C Number: 1234 5678 9012 3456</Text>
            <Text style={styles.detailsText}>SWIFT/BIC: EXAMPBKDH</Text>
          </View>
          <View style={styles.detailsCol}>
            <Text style={styles.detailsTitle}>Terms & Notes</Text>
            <Text style={styles.detailsText}>1. Please pay within 7 days of invoice issue.</Text>
            <Text style={styles.detailsText}>2. For queries, contact hello@neosparkx.com.</Text>
            <Text style={styles.detailsText}>3. Thank you for choosing NeoSparkX!</Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Authorized Signature</Text>
            <Text style={styles.signatureSub}>NeoSparkX Administration</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Client Signature</Text>
            <Text style={styles.signatureSub}>{invoice.client_name}</Text>
          </View>
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

export function InvoicePdfDownload({ invoice }: { invoice: Invoice }) {
  return (
    <div className="flex items-center w-full" onClick={(e) => e.stopPropagation()}>
      <PDFDownloadLink
        document={<InvoiceDocument invoice={invoice} />}
        fileName={`invoice-${invoice.invoice_number}.pdf`}
        className="flex items-center w-full"
      >
        {({ loading }) =>
          loading ? (
            <span className="text-muted-foreground text-sm flex items-center">
              <Download className="h-4 w-4 mr-2" /> Preparing PDF...
            </span>
          ) : (
            <span className="flex items-center w-full">
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </span>
          )
        }
      </PDFDownloadLink>
    </div>
  );
}
