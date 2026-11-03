import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from './data-table';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTablePagination } from './data-table-pagination';
import { DataTableToolbar } from './data-table-toolbar';
import type { DataTableColumnDef } from './features';

type Row = { id: string; name: string; status: string };

const rows: Row[] = [
  { id: '1', name: 'Alice', status: 'active' },
  { id: '2', name: 'Bob', status: 'inactive' },
  { id: '3', name: 'Charlie', status: 'active' },
];

const columns: DataTableColumnDef<Row>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <span>{row.getValue('name')}</span>,
    enableSorting: true,
    filterFn: (row, id, value) =>
      String(row.getValue(id))
        .toLowerCase()
        .includes(String(value ?? '').toLowerCase()),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <span>{row.getValue('status')}</span>,
    enableSorting: false,
  },
];

describe('DataTable', () => {
  it('renders rows', () => {
    render(<DataTable columns={columns} data={rows} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('filters rows via toolbar search', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={rows}
        renderToolbar={(table) => (
          <DataTableToolbar table={table} searchColumnIds={['name']} searchPlaceholder="Search" />
        )}
      />,
    );

    await user.type(screen.getByPlaceholderText('Search'), 'bob');

    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
  });

  it('filters via global filter when no searchColumnIds are provided', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={rows}
        renderToolbar={(table) => (
          <DataTableToolbar table={table} searchPlaceholder="Global search" />
        )}
      />,
    );

    await user.type(screen.getByPlaceholderText('Global search'), 'alice');

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('resets filters when the clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={rows}
        renderToolbar={(table) => (
          <DataTableToolbar table={table} searchColumnIds={['name']} searchPlaceholder="Search" />
        )}
      />,
    );

    await user.type(screen.getByPlaceholderText('Search'), 'bob');
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /limpiar/i }));

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('toggles sort when the sortable header is clicked', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={rows} />);

    const headerButton = screen.getByRole('button', { name: /name/i });
    await user.click(headerButton);

    const cells = screen.getAllByRole('cell');
    // First row's name cell after ascending sort should be "Alice".
    expect(cells[0]).toHaveTextContent('Alice');

    await user.click(headerButton);
    const descCells = screen.getAllByRole('cell');
    expect(descCells[0]).toHaveTextContent('Charlie');
  });

  it('renders non-sortable columns as plain text headers', () => {
    render(<DataTable columns={columns} data={rows} />);

    // "Status" column has enableSorting: false — rendered as a span, not a button
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Status').tagName).toBe('SPAN');
  });

  it('fires onRowClick with the row original when a cell is clicked', async () => {
    const user = userEvent.setup();
    const handleRowClick = vi.fn();

    render(<DataTable columns={columns} data={rows} onRowClick={handleRowClick} />);

    await user.click(screen.getByText('Bob'));

    expect(handleRowClick).toHaveBeenCalledWith(rows[1]);
  });

  it('does not fire onRowClick when clicking an interactive element inside a row', async () => {
    const user = userEvent.setup();
    const handleRowClick = vi.fn();

    const columnsWithButton: DataTableColumnDef<Row>[] = [
      ...columns,
      {
        id: 'actions',
        cell: () => <button type="button">Edit</button>,
      },
    ];

    render(<DataTable columns={columnsWithButton} data={rows} onRowClick={handleRowClick} />);

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]);

    expect(handleRowClick).not.toHaveBeenCalled();
  });

  it('supports controlled row selection via external state', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

    const columnsWithSelect: DataTableColumnDef<Row>[] = [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(event) => row.toggleSelected(event.target.checked)}
          />
        ),
      },
      ...columns,
    ];

    render(
      <DataTable
        columns={columnsWithSelect}
        data={rows}
        rowSelection={{}}
        onRowSelectionChange={onSelectionChange}
        getRowId={(row) => row.id}
      />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    // Click the first row checkbox (checkboxes[1] — first is header "select all")
    await user.click(checkboxes[1]);

    expect(onSelectionChange).toHaveBeenCalledWith({ '1': true });
  });

  it('shows an empty message when there are no rows', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('ignores accents and case in the global search', async () => {
    const user = userEvent.setup();
    const spanishRows: Row[] = [
      { id: '1', name: 'App Móvil v2', status: 'active' },
      { id: '2', name: 'Migración a Cloud', status: 'active' },
      { id: '3', name: 'API Gateway', status: 'active' },
    ];
    render(
      <DataTable
        columns={plainColumns}
        data={spanishRows}
        renderToolbar={(table) => <DataTableToolbar table={table} searchPlaceholder="Buscar" />}
      />,
    );

    await user.type(screen.getByPlaceholderText('Buscar'), 'MOVIL');

    expect(bodyNames()).toEqual(['App Móvil v2']);
  });

  it('ignores accents in a column filter left on auto', async () => {
    const user = userEvent.setup();
    const spanishRows: Row[] = [
      { id: '1', name: 'Ana López', status: 'active' },
      { id: '2', name: 'Ana Lopera', status: 'active' },
    ];
    render(
      <DataTable
        columns={plainColumns}
        data={spanishRows}
        renderToolbar={(table) => (
          <DataTableToolbar table={table} searchColumnIds={['name']} searchPlaceholder="Buscar" />
        )}
      />,
    );

    await user.type(screen.getByPlaceholderText('Buscar'), 'lopez');

    expect(bodyNames()).toEqual(['Ana López']);
  });

  it('keeps the current page when the data is refreshed', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PagedTable data={people(15)} />);

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();

    // A poll or partial reload hands the table a new array with the same rows.
    rerender(<PagedTable data={people(15)} />);

    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    expect(bodyNames()).toEqual(['Person 11', 'Person 12', 'Person 13', 'Person 14', 'Person 15']);
  });

  it('steps back to the last page when a refresh leaves fewer pages', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PagedTable data={people(25)} />);

    await user.click(screen.getByRole('button', { name: 'Última página' }));
    expect(screen.getByText('Página 3 de 3')).toBeInTheDocument();

    rerender(<PagedTable data={people(15)} />);

    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    expect(bodyNames()).toEqual(['Person 11', 'Person 12', 'Person 13', 'Person 14', 'Person 15']);
  });

  it('returns to the first page when a column is sorted', async () => {
    const user = userEvent.setup();
    render(<PagedTable data={people(15)} />);

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    await user.click(screen.getByRole('button', { name: /name/i }));

    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
  });

  it('returns to the first page when the search changes', async () => {
    const user = userEvent.setup();
    render(<PagedTable data={people(25)} />);

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    // "Person 1" matches Person 1 and Person 10–19: eleven rows, two pages.
    await user.type(screen.getByPlaceholderText('Buscar'), 'Person 1');

    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
  });

  it('puts focus back in the search box after clearing it', async () => {
    const user = userEvent.setup();
    render(<PagedTable data={people(5)} />);

    await user.type(screen.getByPlaceholderText('Buscar'), 'Person 3');
    await user.click(screen.getByRole('button', { name: /limpiar/i }));

    expect(screen.getByPlaceholderText('Buscar')).toHaveFocus();
  });
});

const plainColumns: DataTableColumnDef<Row>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
];

function people(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    name: `Person ${i + 1}`,
    status: 'active',
  }));
}

function PagedTable({ data }: { data: Row[] }) {
  return (
    <DataTable
      columns={plainColumns}
      data={data}
      getRowId={(row) => row.id}
      initialPageSize={10}
      renderToolbar={(table) => <DataTableToolbar table={table} searchPlaceholder="Buscar" />}
      renderPagination={(table) => <DataTablePagination table={table} />}
    />
  );
}

function bodyNames(): string[] {
  const body = screen.getAllByRole('rowgroup')[1];
  return within(body)
    .getAllByRole('row')
    .map((row) => row.textContent ?? '');
}
