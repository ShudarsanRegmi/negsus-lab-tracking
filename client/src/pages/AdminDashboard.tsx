import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Computer as ComputerIcon,
  BookOnline as BookingIcon,
  Notifications as NotificationIcon,
} from "@mui/icons-material";
import { computersAPI, bookingsAPI } from "../services/api";
import AdminNotificationPanel from "../components/AdminNotificationPanel";

interface Computer {
  _id: string;
  name: string;
  location: string;
  status: "available" | "maintenance" | "booked";
  specifications: string;
  currentBookings?: Booking[];
  nextAvailable?: string;
  nextAvailableDate?: string;
}

interface Booking {
  _id: string;
  userId: string;
  userInfo?: {
    name: string;
    email: string;
  };
  computerId: {
    _id: string;
    name: string;
    location: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Computer management states
  const [computerDialogOpen, setComputerDialogOpen] = useState(false);
  const [newComputer, setNewComputer] = useState({
    name: "",
    os: "",
    processor: "",
    ram: "",
    rom: "",
    status: "available" as const,
  });

  // Booking management states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<"approved" | "rejected">(
    "approved"
  );
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [computersRes, bookingsRes] = await Promise.all([
        computersAPI.getComputersWithBookings(),
        bookingsAPI.getAllBookings(),
      ]);
      setComputers(computersRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComputer = async () => {
    try {
      // Combine specifications into a single string
      const specifications = `OS: ${newComputer.os}\nProcessor: ${newComputer.processor}\nRAM: ${newComputer.ram}\nROM: ${newComputer.rom}`;

      await computersAPI.createComputer({
        name: newComputer.name,
        location: "Lab", // Default location
        specifications: specifications,
        status: newComputer.status,
      });
      setComputerDialogOpen(false);
      setNewComputer({
        name: "",
        os: "",
        processor: "",
        ram: "",
        rom: "",
        status: "available",
      });
      fetchData();
    } catch (error) {
      console.error("Error adding computer:", error);
      setError("Failed to add computer");
    }
  };

  const handleDeleteComputer = async (computerId: string) => {
    try {
      await computersAPI.deleteComputer(computerId);
      fetchData();
    } catch (error) {
      console.error("Error deleting computer:", error);
      setError("Failed to delete computer");
    }
  };

  const handleUpdateBookingStatus = async () => {
    if (!selectedBooking) return;

    try {
      await bookingsAPI.updateBookingStatus(selectedBooking._id, newStatus);
      setStatusDialogOpen(false);
      setSelectedBooking(null);
      fetchData();
      setStatusUpdateSuccess(
        `Booking status updated to ${newStatus} successfully!`
      );
      setTimeout(() => setStatusUpdateSuccess(null), 5000); // Clear success message after 5 seconds
    } catch (error) {
      console.error("Error updating booking status:", error);
      setError("Failed to update booking status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "pending":
        return "warning";
      case "cancelled":
        return "info";
      default:
        return "info";
    }
  };

  const getComputerStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "success";
      case "maintenance":
        return "warning";
      case "booked":
        return "error";
      default:
        return "info";
    }
  };

  const totalComputers = computers.length;
  const availableComputers = computers.filter(
    (c) => c.status === "available"
  ).length;
  const maintenanceComputers = computers.filter(
    (c) => c.status === "maintenance"
  ).length;
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {statusUpdateSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {statusUpdateSuccess}
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
        variant={isMobile ? "scrollable" : "fullWidth"}
        scrollButtons={isMobile ? "auto" : false}
      >
        <Tab label="Overview" />
        <Tab label="Computers" />
        <Tab label="Bookings" />
        <Tab label="Notifications" />
      </Tabs>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Box>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Pending Approvals */}
            <Grid xs={12} sm={6} md={4} lg={3}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  overflow: "visible",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  borderRadius: 2,
                  minHeight: 140,
                }}
              >
                <CardContent
                  sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    p: 3,
                    "&:last-child": { pb: 3 },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box sx={{ flex: 1, mr: 2 }}>
                      <Typography
                        variant="h6"
                        color="text.secondary"
                        gutterBottom
                        sx={{ fontSize: "0.875rem", fontWeight: 500 }}
                      >
                        Pending Approvals
                      </Typography>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: "bold",
                          mb: 1,
                          fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem" },
                        }}
                      >
                        {pendingBookings}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        bgcolor: "rgba(255, 152, 0, 0.15)",
                        borderRadius: 1.5,
                        p: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 44,
                        height: 44,
                      }}
                    >
                      <NotificationIcon
                        sx={{ color: "#f57c00", fontSize: 22 }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Computers Tab */}
      {activeTab === 1 && (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
            <Typography variant="h6">Computer Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setComputerDialogOpen(true)}
              fullWidth={isMobile}
            >
              Add Computer
            </Button>
          </Box>

          {isMobile ? (
            <List>
              {computers.map((computer) => (
                <React.Fragment key={computer._id}>
                  <ListItem>
                    <ListItemText
                      primary={computer.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {computer.location}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {computer.specifications}
                          </Typography>
                          <Chip
                            label={computer.status}
                            color={
                              getComputerStatusColor(computer.status) as any
                            }
                            size="small"
                            sx={{ mt: 1 }}
                          />
                          {computer.status === "booked" &&
                            computer.nextAvailable && (
                              <Typography
                                variant="caption"
                                color="error"
                                display="block"
                                sx={{ mt: 1 }}
                              >
                                Booked until {computer.nextAvailable} on{" "}
                                {computer.nextAvailableDate}
                              </Typography>
                            )}
                          {computer.status === "maintenance" && (
                            <Typography
                              variant="caption"
                              color="warning.main"
                              display="block"
                              sx={{ mt: 1 }}
                            >
                              Under maintenance
                            </Typography>
                          )}
                          {computer.status === "available" && (
                            <Typography
                              variant="caption"
                              color="success.main"
                              display="block"
                              sx={{ mt: 1 }}
                            >
                              Available now
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleDeleteComputer(computer._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Booking Info</TableCell>
                    <TableCell>Specifications</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {computers.map((computer) => (
                    <TableRow key={computer._id}>
                      <TableCell>{computer.name}</TableCell>
                      <TableCell>{computer.location}</TableCell>
                      <TableCell>
                        <Chip
                          label={computer.status}
                          color={getComputerStatusColor(computer.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {computer.status === "booked" &&
                          computer.nextAvailable && (
                            <Box>
                              <Typography variant="body2" color="error">
                                Booked until {computer.nextAvailable}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Date: {computer.nextAvailableDate}
                              </Typography>
                            </Box>
                          )}
                        {computer.status === "maintenance" && (
                          <Typography variant="body2" color="warning.main">
                            Under maintenance
                          </Typography>
                        )}
                        {computer.status === "available" && (
                          <Typography variant="body2" color="success.main">
                            Available now
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{computer.specifications}</TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteComputer(computer._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Bookings Tab */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Booking Management
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Automatic Notifications:</strong> When you approve or
              reject a booking, the user will automatically receive a
              notification about the status change.
            </Typography>
          </Alert>

          {isMobile ? (
            <List>
              {bookings.map((booking) => (
                <React.Fragment key={booking._id}>
                  <ListItem>
                    <ListItemText
                      primary={booking.computerId.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            User: {booking.userInfo?.name || "Unknown User"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Email: {booking.userInfo?.email || booking.userId}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Date: {new Date(booking.date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Time: {booking.startTime} - {booking.endTime}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Reason: {booking.reason}
                          </Typography>
                          <Chip
                            label={booking.status}
                            color={getStatusColor(booking.status) as any}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      {booking.status === "pending" && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <IconButton
                            color="success"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setNewStatus("approved");
                              setStatusDialogOpen(true);
                            }}
                          >
                            <CheckIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setNewStatus("rejected");
                              setStatusDialogOpen(true);
                            }}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Box>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Computer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>
                        {booking.userInfo?.name || "Unknown User"}
                      </TableCell>
                      <TableCell>
                        {booking.userInfo?.email || booking.userId}
                      </TableCell>
                      <TableCell>{booking.computerId.name}</TableCell>
                      <TableCell>
                        {new Date(booking.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{`${booking.startTime} - ${booking.endTime}`}</TableCell>
                      <TableCell>{booking.reason}</TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status}
                          color={getStatusColor(booking.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {booking.status === "pending" && (
                          <Box>
                            <IconButton
                              color="success"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setNewStatus("approved");
                                setStatusDialogOpen(true);
                              }}
                            >
                              <CheckIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setNewStatus("rejected");
                                setStatusDialogOpen(true);
                              }}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Notifications Tab */}
      {activeTab === 3 && <AdminNotificationPanel />}

      {/* Add Computer Dialog */}
      <Dialog
        open={computerDialogOpen}
        onClose={() => setComputerDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Computer</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={newComputer.name}
              onChange={(e) =>
                setNewComputer({ ...newComputer, name: e.target.value })
              }
              fullWidth
              size={isMobile ? "small" : "medium"}
            />
            <TextField
              label="OS"
              value={newComputer.os}
              onChange={(e) =>
                setNewComputer({ ...newComputer, os: e.target.value })
              }
              fullWidth
              size={isMobile ? "small" : "medium"}
              placeholder="e.g., Windows 11, Ubuntu 22.04, macOS"
            />
            <TextField
              label="Processor"
              value={newComputer.processor}
              onChange={(e) =>
                setNewComputer({ ...newComputer, processor: e.target.value })
              }
              fullWidth
              size={isMobile ? "small" : "medium"}
              placeholder="e.g., Intel i7-12700K, AMD Ryzen 7 5800X"
            />
            <TextField
              label="RAM"
              value={newComputer.ram}
              onChange={(e) =>
                setNewComputer({ ...newComputer, ram: e.target.value })
              }
              fullWidth
              size={isMobile ? "small" : "medium"}
              placeholder="e.g., 16GB DDR4, 32GB DDR5"
            />
            <TextField
              label="ROM"
              value={newComputer.rom}
              onChange={(e) =>
                setNewComputer({ ...newComputer, rom: e.target.value })
              }
              fullWidth
              size={isMobile ? "small" : "medium"}
              placeholder="e.g., 512GB SSD, 1TB NVMe"
            />
            <FormControl fullWidth size={isMobile ? "small" : "medium"}>
              <InputLabel>Status</InputLabel>
              <Select
                value={newComputer.status}
                onChange={(e) =>
                  setNewComputer({
                    ...newComputer,
                    status: e.target.value as any,
                  })
                }
                label="Status"
              >
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="booked">Booked</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComputerDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddComputer} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Booking Status Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Update Booking Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Booking Details
            </Typography>
            {selectedBooking && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Computer:</strong> {selectedBooking.computerId.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>User:</strong>{" "}
                  {selectedBooking.userInfo?.name || "Unknown User"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Email:</strong>{" "}
                  {selectedBooking.userInfo?.email || selectedBooking.userId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Date:</strong>{" "}
                  {new Date(selectedBooking.date).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Time:</strong> {selectedBooking.startTime} -{" "}
                  {selectedBooking.endTime}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Reason:</strong> {selectedBooking.reason}
                </Typography>
              </Box>
            )}
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Automatic Notification:</strong> When you {newStatus} this
              booking, an automatic notification will be sent to the user
              informing them of the status change.
            </Typography>
          </Alert>

          <Typography
            variant="body1"
            sx={{
              fontWeight: "bold",
              color: newStatus === "approved" ? "success.main" : "error.main",
            }}
          >
            Are you sure you want to {newStatus} this booking?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateBookingStatus}
            variant="contained"
            color={newStatus === "approved" ? "success" : "error"}
          >
            {newStatus === "approved" ? "Approve" : "Reject"} Booking
          </Button>
        </DialogActions>
      </Dialog>

      {statusUpdateSuccess && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {statusUpdateSuccess}
        </Alert>
      )}
    </Box>
  );
};

export default AdminDashboard;
