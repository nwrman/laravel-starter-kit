import type { ColumnDef } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from './data-table';
import { DataTablePagination } from './data-table-pagination';

type Row = { id: string; name: string };

// Generate 30 rows to exceed the default page size of 10
const rows: Row[] = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  name: `Person ${i + 1}`,
}));

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <span>{row.getValue('name')}</span>,
  },
];

describe('DataTablePagination', () => {
  it('renders pagination when rows exceed page size', () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        initialPageSize={10}
        renderPagination={(table) => <DataTablePagination table={table} />}
      />,
    );

    expect(screen.getByText('30 destinatarios')).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de/)).toBeInTheDocument();
  });

  it('does not render pagination when all rows fit on one page', () => {
    const fewRows = rows.slice(0, 5);
    render(
      <DataTable
        columns={columns}
        data={fewRows}
        initialPageSize={10}
        renderPagination={(table) => <DataTablePagination table={table} />}
      />,
    );

    expect(screen.queryByText(/Página/)).not.toBeInTheDocument();
  });

  it('navigates to the next page when next button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={rows}
        initialPageSize={10}
        renderPagination={(table) => <DataTablePagination table={table} />}
      />,
    );

    expect(screen.getByText('Person 1')).toBeInTheDocument();
    expect(screen.queryByText('Person 11')).not.toBeInTheDocument();

    // Get all pagination buttons (first, prev, next, last)
    const buttons = screen.getAllByRole('button');
    // The pagination nav buttons are the last 4 buttons in the DOM
    const navButtons = buttons.slice(-4);
    // navButtons[2] is the "next page" button (ChevronRight)
    await user.click(navButtons[2]);

    expect(screen.getByText('Person 11')).toBeInTheDocument();
    expect(screen.queryByText('Person 1')).not.toBeInTheDocument();
  });

  it('navigates to the previous page', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={rows}
        initialPageSize={10}
        renderPagination={(table) => <DataTablePagination table={table} />}
      />,
    );

    // Go forward first
    const navButtons = screen.getAllByRole('button').slice(-4);
    await user.click(navButtons[2]); // next

    expect(screen.getByText('Person 11')).toBeInTheDocument();

    // Go back
    const navButtonsAfter = screen.getAllByRole('button').slice(-4);
    await user.click(navButtonsAfter[1]); // prev

    expect(screen.getByText('Person 1')).toBeInTheDocument();
  });

  it('navigates to first page when first-page button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={rows}
        initialPageSize={10}
        renderPagination={(table) => <DataTablePagination table={table} />}
      />,
    );

    // Go to page 2
    const navButtons = screen.getAllByRole('button').slice(-4);
    await user.click(navButtons[2]); // next

    expect(screen.getByText(/Página 2 de/)).toBeInTheDocument();

    // Click first-page button
    const navButtonsAfter = screen.getAllByRole('button').slice(-4);
    await user.click(navButtonsAfter[0]); // first page

    expect(screen.getByText(/Página 1 de/)).toBeInTheDocument();
  });

  it('navigates to last page when last-page button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={rows}
        initialPageSize={10}
        renderPagination={(table) => <DataTablePagination table={table} />}
      />,
    );

    // Click last-page button
    const navButtons = screen.getAllByRole('button').slice(-4);
    await user.click(navButtons[3]); // last page

    expect(screen.getByText(/Página 3 de/)).toBeInTheDocument();
  });

  it('changes page size via select', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={rows}
        initialPageSize={10}
        renderPagination={(table) => <DataTablePagination table={table} />}
      />,
    );

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, '25');

    // With page size 25, we should see 25 items and 2 pages total
    expect(screen.getByText('Person 25')).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();
  });
});
