import type { RowSelectionState } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from './data-table';
import { DataTablePagination } from './data-table-pagination';
import type { DataTableColumnDef } from './features';

type Row = { id: string; name: string };

// Generate 30 rows to exceed the default page size of 10
const rows: Row[] = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  name: `Person ${i + 1}`,
}));

const columns: DataTableColumnDef<Row>[] = [
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

    expect(screen.getByText('30 resultados')).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de/)).toBeInTheDocument();
  });

  it('shows only the count when every row fits on the smallest page size', () => {
    render(<PagedTable data={rows.slice(0, 5)} />);

    expect(screen.getByText('5 resultados')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Filas por página' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Página/)).not.toBeInTheDocument();
  });

  it('keeps the page-size picker after a size that fits every row', async () => {
    const user = userEvent.setup();
    render(<PagedTable data={rows.slice(0, 15)} />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filas por página' }), '25');

    expect(screen.queryByText(/Página/)).not.toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filas por página' }), '10');
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
  });

  it.each([
    [1, '1 resultado'],
    [2, '2 resultados'],
  ])('counts %i row as "%s"', (count, label) => {
    render(<PagedTable data={rows.slice(0, count)} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it.each<[RowSelectionState, string]>([
    [{ '1': true }, '1 de 30 seleccionado'],
    [{ '1': true, '2': true }, '2 de 30 seleccionados'],
  ])('counts a selection of %o as "%s"', (selection, label) => {
    render(<PagedTable data={rows} rowSelection={selection} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('renders nothing when no row matches', () => {
    render(<PagedTable data={[]} />);

    expect(screen.queryByText(/^\d+ resultados?$/)).not.toBeInTheDocument();
  });

  it.each([
    ['Página siguiente', 'Página anterior', 'Página 3 de 3', 2],
    ['Última página', 'Página anterior', 'Página 3 de 3', 1],
  ])(
    'moves focus from "%s" to "%s" once it disables on the last page',
    async (button, receives, page, presses) => {
      const user = userEvent.setup();
      render(<PagedTable data={rows} />);

      for (let i = 0; i < presses; i++) {
        await user.click(screen.getByRole('button', { name: button }));
      }

      expect(screen.getByText(page)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: receives })).toHaveFocus();
    },
  );

  it.each(['Página anterior', 'Primera página'])(
    'moves focus from "%s" to "Página siguiente" on the first page',
    async (button) => {
      const user = userEvent.setup();
      render(<PagedTable data={rows} />);

      await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
      await user.click(screen.getByRole('button', { name: button }));

      expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Página siguiente' })).toHaveFocus();
    },
  );

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
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));

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
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));

    expect(screen.getByText('Person 11')).toBeInTheDocument();

    // Go back
    await user.click(screen.getByRole('button', { name: 'Página anterior' }));

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
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));

    expect(screen.getByText(/Página 2 de/)).toBeInTheDocument();

    // Click first-page button
    await user.click(screen.getByRole('button', { name: 'Primera página' }));

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
    await user.click(screen.getByRole('button', { name: 'Última página' }));

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

    const select = screen.getByRole('combobox', { name: 'Filas por página' });
    await user.selectOptions(select, '25');

    // With page size 25, we should see 25 items and 2 pages total
    expect(screen.getByText('Person 25')).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();
  });
});

function PagedTable({ data, rowSelection }: { data: Row[]; rowSelection?: RowSelectionState }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      rowSelection={rowSelection}
      initialPageSize={10}
      renderPagination={(table) => <DataTablePagination table={table} />}
    />
  );
}
