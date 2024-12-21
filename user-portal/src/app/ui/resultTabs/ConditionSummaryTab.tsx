interface SummaryTableProps {
    data: { streetName: string; pci: number; surface?: string }[];
}

const SummaryTable: React.FC<SummaryTableProps> = ({ data }) => {
    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Street Name</th>
                        <th>PCI</th>
                        <th>Surface</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index}>
                            <td>{row.streetName}</td>
                            <td>{row.pci}</td>
                            <td>{row.surface || 'N/A'} </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <style jsx>{`
                .table-container {
                    max-height: 400px;
                    overflow-y: auto;
                    border: 1px solid #ccc;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                }
                th, td {
                    padding: 10px;
                    text-align: left;
                    border: 1px solid #ddd;
                }
                th {
                    background-color: #f1f1f1;
                    position: sticky;
                    top: 0; /* Fix the header at the top */
                    z-index: 1; /* Ensure the header stays above the rows */
                }
                tbody tr:nth-child(odd) {
                    background-color: #f9f9f9;
                }
                tbody tr:nth-child(even) {
                    background-color: #ffffff;
                }
            `}</style>
        </div>
    );
};

export default SummaryTable;
